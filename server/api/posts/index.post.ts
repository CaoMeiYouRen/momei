import { z } from 'zod'
import { kebabCase } from 'lodash-es'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { Tag } from '@/server/entities/tag'
import { auth } from '@/lib/auth'
import { generateRandomString } from '@/utils/shared/random'

const createPostSchema = z.object({
    title: z.string().min(1).max(255),
    slug: z.string().min(1).max(255).optional(),
    content: z.string().min(1),
    summary: z.string().optional(),
    coverImage: z.string().optional(),
    language: z.string().default('zh'),
    categoryId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['published', 'draft', 'pending']).default('draft'),
})

export default defineEventHandler(async (event) => {
    const body = await readValidatedBody(event, (b) => createPostSchema.parse(b))
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const postRepo = dataSource.getRepository(Post)
    const tagRepo = dataSource.getRepository(Tag)

    // Slug generation
    let slug = body.slug
    if (!slug) {
        slug = kebabCase(body.title)
        if (!slug) {
            slug = generateRandomString(10)
        }
        // Check for collision
        let existing = await postRepo.findOne({ where: { slug } })
        while (existing) {
            slug = `${slug}-${generateRandomString(4)}`
            existing = await postRepo.findOne({ where: { slug } })
        }
    } else {
        // Check collision
        const existing = await postRepo.findOne({ where: { slug } })
        if (existing) {
            throw createError({ statusCode: 409, statusMessage: 'Slug already exists' })
        }
    }

    // Handle Tags
    const tags: Tag[] = []
    if (body.tags && body.tags.length > 0) {
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

                tag.language = body.language
                await tagRepo.save(tag)
            }
            tags.push(tag)
        }
    }

    const post = new Post()
    post.title = body.title
    post.slug = slug
    post.content = body.content
    if (body.summary !== undefined) {
        post.summary = body.summary
    }
    if (body.coverImage !== undefined) {
        post.coverImage = body.coverImage
    }
    post.language = body.language
    if (body.categoryId !== undefined) {
        post.categoryId = body.categoryId
    }
    post.authorId = session.user.id
    post.status = body.status
    post.tags = tags

    // Enforce 'pending' for non-admin/author if they try to publish directly
    if (session.user.role !== 'admin' && session.user.role !== 'author' && post.status === 'published') {
        post.status = 'pending'
    }

    if (post.status === 'published') {
        post.publishedAt = new Date()
    }

    await postRepo.save(post)

    return {
        code: 200,
        data: post,
    }
})
