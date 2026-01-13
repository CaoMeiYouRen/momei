import { kebabCase } from 'lodash-es'
import type { z } from 'zod'
import { ensureTags } from './tag'
import { snowflake } from '@/server/utils/snowflake'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { Category } from '@/server/entities/category'
import { generateRandomString } from '@/utils/shared/random'
import { createPostSchema } from '@/utils/schemas/post'
import { PostStatus } from '@/types/post'

type CreatePostInput = z.infer<typeof createPostSchema>

export const createPostService = async (body: CreatePostInput, authorId: string, options: { isAdmin: boolean }) => {
    const postRepo = dataSource.getRepository(Post)
    const categoryRepo = dataSource.getRepository(Category)

    // Slug generation
    let slug = body.slug
    if (!slug) {
        slug = kebabCase(body.title)
        if (!slug) {
            slug = generateRandomString(10)
        }
        // Check for collision
        let existing = await postRepo.findOne({ where: { slug, language: body.language } })
        while (existing) {
            slug = `${slug}-${generateRandomString(4)}`
            existing = await postRepo.findOne({ where: { slug, language: body.language } })
        }
    } else {
        // Check collision
        const existing = await postRepo.findOne({ where: { slug, language: body.language } })
        if (existing) {
            throw createError({ statusCode: 409, statusMessage: 'Slug already exists' })
        }
    }

    // Handle Tags
    const tags = await ensureTags(body.tags || [], body.language)

    const post = new Post()
    post.title = body.title
    post.slug = slug
    post.content = body.content
    if (body.summary !== undefined) {
        post.summary = body.summary
    }
    if (body.coverImage !== undefined) {
        post.coverImage = body.coverImage ?? null
    }
    post.language = body.language
    post.translationId = body.translationId || snowflake.generateId()

    // Handle Category
    let targetCategoryId: string | null | undefined = undefined
    if (body.categoryId) {
        const category = await categoryRepo.findOne({ where: { id: body.categoryId } })
        if (!category) {
            throw createError({ statusCode: 400, statusMessage: `Category with ID "${body.categoryId}" not found` })
        }
        targetCategoryId = category.id
    } else if (body.category) {
        const category = await categoryRepo.findOne({
            where: [
                { slug: body.category, language: body.language },
                { name: body.category, language: body.language },
            ],
        })
        if (!category) {
            throw createError({ statusCode: 400, statusMessage: `Category "${body.category}" not found for language "${body.language}"` })
        }
        targetCategoryId = category.id
    } else if (body.categoryId === null || body.category === null) {
        targetCategoryId = null
    }

    if (targetCategoryId !== undefined) {
        post.categoryId = targetCategoryId
    }

    if (body.copyright !== undefined) {
        post.copyright = body.copyright
    }
    post.authorId = authorId
    post.tags = tags

    const targetStatus = body.status as PostStatus
    if (!options.isAdmin) {
        // Enforce 'pending' for non-admin if they try to publish directly
        if (targetStatus === PostStatus.PUBLISHED) {
            post.status = PostStatus.PENDING
        } else {
            post.status = targetStatus
        }
    } else {
        post.status = targetStatus
    }

    if (post.status === PostStatus.PUBLISHED) {
        post.publishedAt = new Date()
    }

    await postRepo.save(post)

    return post
}
