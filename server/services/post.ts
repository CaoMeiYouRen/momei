import { kebabCase } from 'lodash-es'
import type { z } from 'zod'
import { ensureTags } from './tag'
import { createCampaignFromPost, sendMarketingCampaign } from './notification'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { Category } from '@/server/entities/category'
import { generateRandomString } from '@/utils/shared/random'
import { createPostSchema, updatePostSchema } from '@/utils/schemas/post'
import { PostStatus, POST_STATUS_TRANSITIONS } from '@/types/post'
import { hashPassword } from '@/server/utils/password'
import { assignDefined } from '@/server/utils/object'
import { MarketingCampaignStatus } from '@/utils/shared/notification'
import { createMemo } from '@/server/utils/memos'
import { getSetting } from '@/server/services/setting'
import { SettingKey } from '@/types/setting'

type CreatePostInput = z.infer<typeof createPostSchema>
type UpdatePostInput = z.infer<typeof updatePostSchema>

/**
 * 内部辅助函数：应用字段变更、处理分类、标签、状态和管理员字段
 */
async function applyPostChanges(
    post: Post,
    body: CreatePostInput | UpdatePostInput,
    options: { isAdmin: boolean },
    isNew: boolean,
) {
    const categoryRepo = dataSource.getRepository(Category)

    // 1. 基础字段赋值
    assignDefined(post, body, [
        'title', 'content', 'summary', 'coverImage',
        'audioUrl', 'audioDuration', 'audioSize', 'audioMimeType',
        'language', 'translationId', 'copyright', 'visibility',
    ])

    // 2. 分类处理 (逻辑复用)
    let targetCategoryId: string | null | undefined = undefined
    if (body.categoryId !== undefined) {
        if (body.categoryId === null) {
            targetCategoryId = null
        } else {
            const category = await categoryRepo.findOne({ where: { id: body.categoryId } })
            if (!category) {
                throw createError({ statusCode: 400, statusMessage: `Category with ID "${body.categoryId}" not found` })
            }
            targetCategoryId = category.id
        }
    } else if (body.category !== undefined) {
        if (body.category === null) {
            targetCategoryId = null
        } else {
            const targetLang = body.language || post.language
            const category = await categoryRepo.findOne({
                where: [
                    { slug: body.category, language: targetLang },
                    { name: body.category, language: targetLang },
                ],
            })
            if (!category) {
                throw createError({ statusCode: 400, statusMessage: `Category "${body.category}" not found` })
            }
            targetCategoryId = category.id
        }
    }
    if (targetCategoryId !== undefined) {
        post.categoryId = targetCategoryId
    }

    // 3. 标签处理
    if (body.tags) {
        post.tags = await ensureTags(body.tags, body.language || post.language)
    }

    // 4. 密码处理
    if (body.password !== undefined) {
        post.password = body.password ? hashPassword(body.password) : null
    }

    // 5. 管理员特权字段
    if (options.isAdmin) {
        if (body.createdAt) {
            post.createdAt = body.createdAt
        }
        if (body.views !== undefined) {
            post.views = body.views
        }
        // 如果是创建时，允许显式指定 publishedAt（用于迁移）
        if (isNew && body.publishedAt) {
            post.publishedAt = body.publishedAt
        } else if (!isNew && body.publishedAt !== undefined) {
            // 更新时也允许显式修改（如修正时间）
            post.publishedAt = body.publishedAt
        }
    }

    // 6. 状态转换与发布时间逻辑
    if (body.status) {
        const currentStatus = post.status
        const targetStatus = body.status as PostStatus

        // 状态转换校验（非管理员）
        if (!isNew && currentStatus !== targetStatus && !options.isAdmin) {
            const allowedTransitions = POST_STATUS_TRANSITIONS[currentStatus] || []
            if (!allowedTransitions.includes(targetStatus)) {
                throw createError({
                    statusCode: 400,
                    statusMessage: `Invalid status transition from ${currentStatus} to ${targetStatus}`,
                })
            }
        }

        // 状态应用（普通作者强制进入 pending）
        if (!options.isAdmin && targetStatus === PostStatus.PUBLISHED) {
            post.status = PostStatus.PENDING
        } else {
            post.status = targetStatus
        }

        // 发布时间逻辑：
        // 如果是非发布 -> 已发布，更新时间为当前（重新发布）
        // 如果是新创建且状态为发布，且还没设置过，更新时间为当前
        if (post.status === PostStatus.PUBLISHED) {
            const isRepublishing = !isNew && currentStatus !== PostStatus.PUBLISHED
            if (isRepublishing || !post.publishedAt) {
                post.publishedAt = new Date()
            }
        }
    }
}

export const createPostService = async (body: CreatePostInput, authorId: string, options: { isAdmin: boolean }) => {
    const postRepo = dataSource.getRepository(Post)

    // Slug 处理
    let slug = body.slug
    if (!slug) {
        slug = kebabCase(body.title) || generateRandomString(10)
        let existing = await postRepo.findOne({ where: { slug, language: body.language } })
        while (existing) {
            slug = `${slug}-${generateRandomString(4)}`
            existing = await postRepo.findOne({ where: { slug, language: body.language } })
        }
    } else {
        const existing = await postRepo.findOne({ where: { slug, language: body.language } })
        if (existing) {
            throw createError({ statusCode: 409, statusMessage: 'Slug already exists' })
        }
    }

    const post = new Post()
    post.authorId = authorId
    post.slug = slug

    await applyPostChanges(post, body, options, true)
    await postRepo.save(post)

    // 处理 Memos 同步逻辑
    if (body.syncToMemos && post.status === PostStatus.PUBLISHED) {
        const siteUrl = await getSetting(SettingKey.SITE_URL)
        const postUrl = `${siteUrl}/posts/${post.slug}`
        const tagsStr = post.tags?.map((t) => `#${t.name}`).join(' ') || ''
        const content = `# ${post.title}\n\n${post.summary || ''}\n\n${postUrl}\n\n${tagsStr}`

        void createMemo({ content }).then(async (res: any) => {
            if (res?.name) {
                await postRepo.update(post.id, { memosId: res.name })
            }
        }).catch((err) => {
            console.error('[Memos] Auto sync failed:', err)
        })
    }

    // 处理推送逻辑
    if (body.pushOption && body.pushOption !== 'none' && post.status === PostStatus.PUBLISHED) {
        const campaignStatus = body.pushOption === 'now' ? MarketingCampaignStatus.SENDING : MarketingCampaignStatus.DRAFT
        const campaign = await createCampaignFromPost(post.id, authorId, campaignStatus)
        if (body.pushOption === 'now') {
            void sendMarketingCampaign(campaign.id).catch((err) => {
                console.error('Failed to send marketing campaign:', err)
            })
        }
    }

    return post
}

export const updatePostService = async (id: string, body: UpdatePostInput, options: { isAdmin: boolean, currentUserId: string }) => {
    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOne({ where: { id }, relations: ['tags'] })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    const currentStatus = post.status

    // 权限校验
    if (post.authorId !== options.currentUserId && !options.isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // Slug / Language 冲突校验
    if (
        (body.slug && body.slug !== post.slug)
        || (body.language && body.language !== post.language)
    ) {
        const targetSlug = body.slug ?? post.slug
        const targetLanguage = body.language ?? post.language
        const existing = await postRepo.findOne({
            where: { slug: targetSlug, language: targetLanguage },
        })
        if (existing && existing.id !== post.id) {
            throw createError({ statusCode: 409, statusMessage: 'Post slug already exists in this language' })
        }
        if (body.slug) {
            post.slug = body.slug
        }
    }

    await applyPostChanges(post, body, options, false)
    await postRepo.save(post)

    // 处理 Memos 同步逻辑
    if (body.syncToMemos && post.status === PostStatus.PUBLISHED && !post.memosId) {
        const siteUrl = await getSetting(SettingKey.SITE_URL)
        const postUrl = `${siteUrl}/posts/${post.slug}`
        const tagsStr = post.tags?.map((t) => `#${t.name}`).join(' ') || ''
        const content = `# ${post.title}\n\n${post.summary || ''}\n\n${postUrl}\n\n${tagsStr}`

        void createMemo({ content }).then(async (res: any) => {
            if (res?.name) {
                await postRepo.update(post.id, { memosId: res.name })
            }
        }).catch((err) => {
            console.error('[Memos] Auto sync failed:', err)
        })
    }

    // 处理推送逻辑 (仅在文章首次发布时)
    if (body.pushOption && body.pushOption !== 'none'
        && currentStatus !== PostStatus.PUBLISHED && post.status === PostStatus.PUBLISHED) {
        const campaignStatus = body.pushOption === 'now' ? MarketingCampaignStatus.SENDING : MarketingCampaignStatus.DRAFT
        const campaign = await createCampaignFromPost(post.id, options.currentUserId, campaignStatus, body.pushCriteria)
        if (body.pushOption === 'now') {
            void sendMarketingCampaign(campaign.id).catch((err) => {
                console.error('Failed to send marketing campaign:', err)
            })
        }
    }

    return post
}

