import { kebabCase } from 'lodash-es'
import type { z } from 'zod'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { Tag } from '@/server/entities/tag'
import { generateRandomString } from '@/utils/shared/random'
import { createPostSchema } from '@/utils/schemas/post'

type CreatePostInput = z.infer<typeof createPostSchema>

export const createPostService = async (body: CreatePostInput, authorId: string, options: { isAdmin: boolean }) => {
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
    if (body.copyright !== undefined) {
        post.copyright = body.copyright
    }
    post.authorId = authorId
    post.status = body.status
    post.tags = tags

    // Enforce 'pending' for non-admin if they try to publish directly
    if (!options.isAdmin && post.status === 'published') {
        post.status = 'pending'
    }

    if (post.status === 'published') {
        post.publishedAt = new Date()
    }

    await postRepo.save(post)

    return post
}
