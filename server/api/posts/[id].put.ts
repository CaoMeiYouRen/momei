import { kebabCase } from 'lodash-es'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { Tag } from '@/server/entities/tag'
import { Category } from '@/server/entities/category'
import { generateRandomString } from '@/utils/shared/random'
import { updatePostSchema } from '@/utils/schemas/post'
import { success, fail } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { isAdmin } from '@/utils/shared/roles'
import { PostStatus, POST_STATUS_TRANSITIONS } from '@/types/post'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readValidatedBody(event, (b) => updatePostSchema.parse(b))
    const session = await requireAdminOrAuthor(event)

    const postRepo = dataSource.getRepository(Post)
    const tagRepo = dataSource.getRepository(Tag)
    const categoryRepo = dataSource.getRepository(Category)

    const post = await postRepo.findOne({ where: { id }, relations: ['tags'] })
    if (!post) {
        return fail('Post not found', 404)
    }

    // Permission check
    const isAuthor = session.user.id === post.authorId
    const isUserAdmin = isAdmin(session.user.role)
    if (!isAuthor && !isUserAdmin) {
        return fail('Forbidden', 403)
    }

    // Update fields
    if (body.title) {
        post.title = body.title
    }
    if (body.content) {
        post.content = body.content
    }
    if (body.summary !== undefined) {
        post.summary = body.summary
    }
    if (body.coverImage !== undefined) {
        post.coverImage = body.coverImage
    }
    if (body.language) {
        post.language = body.language
    }
    if (body.translationId !== undefined) {
        post.translationId = body.translationId
    }

    // ... (Category logic omitted for brevity in search string)

    // Handle Category
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
                throw createError({ statusCode: 400, statusMessage: `Category "${body.category}" not found for language "${targetLang}"` })
            }
            targetCategoryId = category.id
        }
    }

    if (targetCategoryId !== undefined) {
        post.categoryId = targetCategoryId
    }

    if (body.copyright !== undefined) {
        post.copyright = body.copyright
    }

    // Handle Slug Change
    if (
        (body.slug && body.slug !== post.slug)
        || (body.language && body.language !== post.language)
    ) {
        const targetSlug = body.slug ?? post.slug
        const targetLanguage = body.language ?? post.language
        const existing = await postRepo.findOne({
            where: {
                slug: targetSlug,
                language: targetLanguage,
            },
        })
        if (existing && existing.id !== post.id) {
            throw createError({ statusCode: 409, statusMessage: 'Post slug already exists in this language' })
        }
        if (body.slug) {
            post.slug = body.slug
        }
    }

    if (body.status) {
        const currentStatus = post.status as PostStatus
        const targetStatus = body.status as PostStatus

        // 仅在状态发生改变时校验转换逻辑
        if (currentStatus !== targetStatus && !isUserAdmin) {
            const allowedTransitions = POST_STATUS_TRANSITIONS[currentStatus] || []
            if (!allowedTransitions.includes(targetStatus)) {
                throw createError({
                    statusCode: 400,
                    statusMessage: `Invalid status transition from ${currentStatus} to ${targetStatus}`,
                })
            }
        }

        if (!isUserAdmin) {
            // Authors cannot publish directly, it goes to pending
            if (targetStatus === PostStatus.PUBLISHED) {
                post.status = PostStatus.PENDING
            } else if (targetStatus === PostStatus.REJECTED) {
                throw createError({ statusCode: 403, statusMessage: 'Only admins can reject posts' })
            } else {
                post.status = targetStatus
            }
        } else {
            post.status = targetStatus
        }

        if (post.status === PostStatus.PUBLISHED && !post.publishedAt) {
            post.publishedAt = new Date()
        }
    }

    // Handle Tags
    if (body.tags) {
        const tags: Tag[] = []
        const postLanguage = body.language || post.language
        for (const tagName of body.tags) {
            let tag = await tagRepo.findOne({
                where: {
                    name: tagName,
                    language: postLanguage,
                },
            })
            if (!tag) {
                tag = new Tag()
                tag.name = tagName
                tag.slug = kebabCase(tagName)
                if (!tag.slug) {
                    tag.slug = generateRandomString(8)
                }
                tag.language = postLanguage
                // Check tag slug collision
                let existingTagSlug = await tagRepo.findOne({
                    where: {
                        slug: tag.slug,
                        language: postLanguage,
                    },
                })
                while (existingTagSlug) {
                    tag.slug = `${tag.slug}-${generateRandomString(4)}`
                    existingTagSlug = await tagRepo.findOne({
                        where: {
                            slug: tag.slug,
                            language: postLanguage,
                        },
                    })
                }
                await tagRepo.save(tag)
            }
            tags.push(tag)
        }
        post.tags = tags
    }

    await postRepo.save(post)

    return success(post)
})
