import { z } from 'zod'
import { kebabCase } from 'lodash-es'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { Tag } from '@/server/entities/tag'
import { auth } from '@/lib/auth'
import { generateRandomString } from '@/utils/shared/random'
import { isSnowflakeId } from '@/utils/shared/validate'

const updatePostSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).optional().refine((val) => !val || !isSnowflakeId(val), {
        message: 'Slug cannot be in Snowflake ID format',
    }),
    content: z.string().min(1).optional(),
    summary: z.string().optional(),
    coverImage: z.string().optional(),
    language: z.string().optional(),
    categoryId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['published', 'draft', 'pending']).optional(),
})

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readValidatedBody(event, (b) => updatePostSchema.parse(b))
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const postRepo = dataSource.getRepository(Post)
    const tagRepo = dataSource.getRepository(Tag)

    const post = await postRepo.findOne({ where: { id }, relations: ['tags'] })
    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    // Permission check
    const isAuthor = session.user.id === post.authorId
    const isAdmin = session.user.role === 'admin'
    if (!isAuthor && !isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
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
    if (body.categoryId !== undefined) {
        post.categoryId = body.categoryId
    }

    if (body.slug && body.slug !== post.slug) {
        // Check collision
        const existing = await postRepo.findOne({ where: { slug: body.slug } })
        if (existing && existing.id !== post.id) {
            throw createError({ statusCode: 409, statusMessage: 'Slug already exists' })
        }
        post.slug = body.slug
    }

    if (body.status) {
        if (session.user.role !== 'admin' && body.status === 'published') {
            post.status = 'pending'
        } else {
            post.status = body.status
        }

        if (post.status === 'published' && !post.publishedAt) {
            post.publishedAt = new Date()
        }
    }

    // Handle Tags
    if (body.tags) {
        const tags: Tag[] = []
        for (const tagName of body.tags) {
            let tag = await tagRepo.findOne({ where: { name: tagName } })
            if (!tag) {
                tag = new Tag()
                tag.name = tagName
                tag.slug = kebabCase(tagName)
                if (!tag.slug) {
                    tag.slug = generateRandomString(8)
                }
                // Check tag slug collision
                let existingTagSlug = await tagRepo.findOne({ where: { slug: tag.slug } })
                while (existingTagSlug) {
                    tag.slug = `${tag.slug}-${generateRandomString(4)}`
                    existingTagSlug = await tagRepo.findOne({ where: { slug: tag.slug } })
                }
                tag.language = post.language
                await tagRepo.save(tag)
            }
            tags.push(tag)
        }
        post.tags = tags
    }

    await postRepo.save(post)

    return {
        code: 200,
        data: post,
    }
})
