import { z } from 'zod'
import { isSnowflakeId } from '../shared/validate'
import { paginationSchema } from './pagination'

export const createPostSchema = z.object({
    title: z.string().min(1).max(255),
    slug: z.string().min(1).max(255).optional().refine((val) => !val || !isSnowflakeId(val), {
        message: 'Slug cannot be in Snowflake ID format',
    }),
    content: z.string().min(1),
    summary: z.string().nullable().optional(),
    coverImage: z.string().nullable().optional(),
    language: z.string().default('zh-CN'),
    category: z.string().nullable().optional(),
    categoryId: z.string().nullable().optional(),
    copyright: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['published', 'draft', 'pending']).default('draft'),
})

export const updatePostSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).optional().refine((val) => !val || !isSnowflakeId(val), {
        message: 'Slug cannot be in Snowflake ID format',
    }),
    content: z.string().min(1).optional(),
    summary: z.string().nullable().optional(),
    coverImage: z.string().nullable().optional(),
    language: z.string().optional(),
    category: z.string().nullable().optional(),
    categoryId: z.string().nullable().optional(),
    copyright: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['published', 'draft', 'pending']).optional(),
})

export const postQuerySchema = paginationSchema.extend({
    status: z.preprocess((val) => (val === '' ? undefined : val), z.enum(['published', 'draft', 'pending']).optional()),
    scope: z.enum(['public', 'manage']).default('public'),
    authorId: z.string().optional(),
    category: z.string().optional(),
    tagId: z.string().optional(),
    language: z.string().optional(),
    search: z.string().optional(),
    orderBy: z.enum(['createdAt', 'updatedAt', 'views', 'publishedAt', 'title', 'status']).default('publishedAt'),
    order: z.enum(['ASC', 'DESC']).default('DESC'),
})

export const updatePostStatusSchema = z.object({
    status: z.enum(['published', 'draft', 'pending']),
})

export const archiveQuerySchema = z.object({
    year: z.coerce.number().int().min(1970).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    language: z.string().optional(),
    includePosts: z.coerce.boolean().default(false),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    scope: z.enum(['public', 'manage']).default('public'),
})
