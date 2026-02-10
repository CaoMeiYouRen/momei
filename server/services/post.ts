import { kebabCase } from 'lodash-es'
import type { z } from 'zod'
import { ensureTags } from './tag'
import { executePublishEffects } from './post-publish'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { Category } from '@/server/entities/category'
import { generateRandomString } from '@/utils/shared/random'
import { createPostSchema, updatePostSchema } from '@/utils/schemas/post'
import { PostStatus, POST_STATUS_TRANSITIONS, type PublishIntent } from '@/types/post'
import { hashPassword } from '@/server/utils/password'
import { assignDefined } from '@/server/utils/object'

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

    // 1.基础字段赋值
    assignDefined(post, body, [
        'title', 'content', 'summary', 'coverImage',
        'audioUrl', 'audioDuration', 'audioSize', 'audioMimeType',
        'language', 'translationId', 'copyright', 'visibility',
        'scaffoldOutline', 'scaffoldMetadata', 'publishIntent',
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

    // 5. 特权字段与发布时间
    if (options.isAdmin) {
        if (body.createdAt) {
            post.createdAt = body.createdAt
        }
        if (body.views !== undefined) {
            post.views = body.views
        }
    }

    // 无论是否为管理员，只要是进入或处于定时发布状态，都允许设置/更新发布时间
    if (body.publishedAt !== undefined) {
        if (options.isAdmin || body.status === PostStatus.SCHEDULED || post.status === PostStatus.SCHEDULED) {
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

        // 定时发布逻辑校验
        if (post.status === PostStatus.SCHEDULED) {
            const publishDate = post.publishedAt
            if (!publishDate) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'publishedAt is required for scheduled post',
                })
            }
            if (publishDate.getTime() <= Date.now()) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'publishedAt must be in the future for scheduled post',
                })
            }
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

    // 处理发布后副作用 (Memos 同步, 邮件推送等)
    if (post.status === PostStatus.PUBLISHED) {
        const intent: PublishIntent = {
            syncToMemos: body.syncToMemos,
            pushOption: body.pushOption,
            pushCriteria: body.pushCriteria,
        }
        void executePublishEffects(post, intent)
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

    // 处理发布后副作用 (仅在文章首次发布时，或者已发布文章修改了同步/推送意图时)
    // 注意：如果是定时发布任务触发的发布，不走此逻辑，而是走任务引擎的 executePublishEffects
    if (currentStatus !== PostStatus.PUBLISHED && post.status === PostStatus.PUBLISHED) {
        const intent: PublishIntent = {
            syncToMemos: body.syncToMemos,
            pushOption: body.pushOption,
            pushCriteria: body.pushCriteria,
        }
        void executePublishEffects(post, intent)
    }

    return post
}

