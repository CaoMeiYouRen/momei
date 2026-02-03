import { z } from 'zod'
import { isSnowflakeId, isValidCustomUrl } from '../shared/validate'
import { paginationSchema } from './pagination'
import { PostStatus, PostVisibility } from '@/types/post'

const postStatusEnum = z.enum([
    PostStatus.DRAFT,
    PostStatus.PENDING,
    PostStatus.PUBLISHED,
    PostStatus.REJECTED,
    PostStatus.HIDDEN,
] as [PostStatus, ...PostStatus[]])

const postVisibilityEnum = z.enum([
    PostVisibility.PUBLIC,
    PostVisibility.PRIVATE,
    PostVisibility.PASSWORD,
    PostVisibility.REGISTERED,
    PostVisibility.SUBSCRIBER,
] as [PostVisibility, ...PostVisibility[]])

const sharedPostFields = {
    title: z.string().min(1).max(255),
    slug: z.string().min(1).max(255).refine((val) => !val || !isSnowflakeId(val), {
        message: 'Slug cannot be in Snowflake ID format',
    }),
    content: z.string().min(1),
    summary: z.string().nullable().optional(),
    coverImage: z
        .string()
        .nullable()
        .optional()
        .refine((url) => isValidCustomUrl(url), {
            message: 'Cover image URL must be from a whitelisted domain or local path',
        }),
    audioUrl: z
        .string()
        .nullable()
        .optional()
        .refine((url) => isValidCustomUrl(url), {
            message: 'Audio URL must be from a whitelisted domain or local path',
        }),
    audioDuration: z.coerce.number().int().min(0).nullable().optional(),
    audioSize: z.coerce.number().int().min(0).nullable().optional(),
    audioMimeType: z.string().max(100).nullable().optional(),
    language: z.string(),
    translationId: z.string().max(255).nullable().optional(),
    category: z.string().nullable().optional(),
    categoryId: z.string().nullable().optional(),
    copyright: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    status: postStatusEnum,
    visibility: postVisibilityEnum,
    password: z.string().nullable().optional(),
}

export const createPostSchema = z.object({
    ...sharedPostFields,
    slug: sharedPostFields.slug.optional(),
    language: sharedPostFields.language.default('zh-CN'),
    status: sharedPostFields.status.default(PostStatus.DRAFT),
    visibility: sharedPostFields.visibility.default(PostVisibility.PUBLIC),
    createdAt: z.coerce.date().optional(),
    views: z.coerce.number().int().min(0).optional(),
})

export const updatePostSchema = z.object(sharedPostFields).partial().extend({
    slug: sharedPostFields.slug.optional(),
})

export const postQuerySchema = paginationSchema.extend({
    status: z.preprocess((val) => (val === '' ? undefined : val), postStatusEnum.optional()),
    scope: z.enum(['public', 'manage']).default('public'),
    authorId: z.string().optional(),
    category: z.string().optional(), // Can match slug or ID in the logic
    categoryId: z.string().optional(),
    tag: z.string().optional(), // Tag slug
    tagId: z.string().optional(),
    language: z.string().optional(),
    translationId: z.string().optional(),
    search: z.string().optional(),
    aggregate: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
    orderBy: z.enum(['createdAt', 'updatedAt', 'views', 'publishedAt', 'title', 'status']).default('publishedAt'),
    order: z.enum(['ASC', 'DESC']).default('DESC'),
})

export const updatePostStatusSchema = z.object({
    status: postStatusEnum,
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
