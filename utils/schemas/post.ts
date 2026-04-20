import { z } from 'zod'
import { splitAndNormalizeStringList } from '../shared/string-list'
import { isSnowflakeId, isValidCustomUrl } from '../shared/validate'
import { paginationSchema } from './pagination'
import { PostStatus, PostVisibility } from '@/types/post'

const postStatusEnum = z.enum([
    PostStatus.DRAFT,
    PostStatus.PENDING,
    PostStatus.PUBLISHED,
    PostStatus.REJECTED,
    PostStatus.HIDDEN,
    PostStatus.SCHEDULED,
] as [PostStatus, ...PostStatus[]])

const postVisibilityEnum = z.enum([
    PostVisibility.PUBLIC,
    PostVisibility.PRIVATE,
    PostVisibility.PASSWORD,
    PostVisibility.REGISTERED,
    PostVisibility.SUBSCRIBER,
] as [PostVisibility, ...PostVisibility[]])

const publishIntentSchema = z.object({
    syncToMemos: z.boolean().optional(),
    pushOption: z.enum(['none', 'draft', 'now']).optional(),
    pushCriteria: z
        .object({
            categoryIds: z.array(z.string()).optional(),
            tagIds: z.array(z.string()).optional(),
        })
        .optional(),
})

const distributionStatusSchema = z.enum(['idle', 'delivering', 'succeeded', 'failed', 'cancelled'])
const distributionChannelSchema = z.enum(['memos', 'wechatsync'])
const distributionActionSchema = z.enum(['create', 'update', 'republish', 'retry', 'terminate'])
const distributionModeSchema = z.enum(['update-existing', 'republish-new'])
const distributionFailureReasonSchema = z.enum([
    'auth_failed',
    'rate_limited',
    'network_error',
    'content_validation_failed',
    'remote_missing',
    'manual_terminated',
    'unknown',
])

const distributionChannelStateSchema = z.object({
    status: distributionStatusSchema.nullable().optional(),
    remoteId: z.string().max(255).nullable().optional(),
    remoteUrl: z.string().max(2048).nullable().optional(),
    lastMode: distributionModeSchema.nullable().optional(),
    lastAction: distributionActionSchema.nullable().optional(),
    lastAttemptId: z.string().max(255).nullable().optional(),
    activeAttemptId: z.string().max(255).nullable().optional(),
    lastAttemptAt: z.coerce.date().nullable().optional(),
    activeSince: z.coerce.date().nullable().optional(),
    lastSuccessAt: z.coerce.date().nullable().optional(),
    lastFailureAt: z.coerce.date().nullable().optional(),
    lastFinishedAt: z.coerce.date().nullable().optional(),
    lastFailureReason: distributionFailureReasonSchema.nullable().optional(),
    lastMessage: z.string().max(2000).nullable().optional(),
    lastOperatorId: z.string().max(255).nullable().optional(),
    retryCount: z.coerce.number().int().min(0).nullable().optional(),
})

const distributionTimelineEntrySchema = z.object({
    id: z.string().min(1).max(255),
    channel: distributionChannelSchema,
    action: distributionActionSchema,
    mode: distributionModeSchema.nullable().optional(),
    status: distributionStatusSchema,
    triggeredBy: z.enum(['manual', 'retry', 'system']).nullable().optional(),
    operatorId: z.string().max(255).nullable().optional(),
    startedAt: z.coerce.date(),
    finishedAt: z.coerce.date().nullable().optional(),
    retryOfAttemptId: z.string().max(255).nullable().optional(),
    remoteId: z.string().max(255).nullable().optional(),
    remoteUrl: z.string().max(2048).nullable().optional(),
    failureReason: distributionFailureReasonSchema.nullable().optional(),
    message: z.string().max(2000).nullable().optional(),
    details: z.record(z.string(), z.unknown()).nullable().optional(),
})

const booleanQueryValueSchema = z.preprocess((val) => {
    if (val === '' || val === undefined || val === null) {
        return undefined
    }

    if (typeof val === 'string') {
        if (val === 'true') {
            return true
        }

        if (val === 'false') {
            return false
        }
    }

    return val
}, z.boolean().optional())

const stringArrayQuerySchema = z.preprocess((val) => {
    if (val === '' || val === undefined || val === null) {
        return undefined
    }

    const values = Array.isArray(val) ? val : [val]

    return values
        .flatMap((item) => typeof item === 'string'
            ? splitAndNormalizeStringList(item, { delimiters: ',' })
            : [])
}, z.array(z.string()).optional())

const postMetadataSchema = z.object({
    cover: z
        .object({
            url: z
                .string()
                .nullable()
                .optional()
                .refine((url) => isValidCustomUrl(url), {
                    message: 'Cover image URL must be from a whitelisted domain or local path',
                }),
            source: z.enum(['ai', 'upload', 'manual']).nullable().optional(),
            prompt: z.string().max(2000).nullable().optional(),
            promptModel: z.object({
                type: z.string().max(240),
                palette: z.string().max(240),
                rendering: z.string().max(240),
                text: z.string().max(240),
                mood: z.string().max(240),
            }).nullable().optional(),
            assetUsage: z.enum(['post-cover', 'post-illustration', 'topic-hero', 'event-poster']).nullable().optional(),
            applyMode: z.enum(['auto-apply', 'manual-confirm']).nullable().optional(),
            language: z.string().max(10).nullable().optional(),
            translationId: z.string().max(255).nullable().optional(),
            postId: z.string().max(255).nullable().optional(),
            generatedAt: z.coerce.date().nullable().optional(),
        })
        .optional(),
    visualAssets: z.array(z.object({
        usage: z.enum(['post-cover', 'post-illustration', 'topic-hero', 'event-poster']),
        url: z
            .string()
            .nullable()
            .optional()
            .refine((url) => isValidCustomUrl(url), {
                message: 'Visual asset URL must be from a whitelisted domain or local path',
            }),
        source: z.enum(['ai', 'upload', 'manual']).nullable().optional(),
        prompt: z.string().max(2000).nullable().optional(),
        promptModel: z.object({
            type: z.string().max(240),
            palette: z.string().max(240),
            rendering: z.string().max(240),
            text: z.string().max(240),
            mood: z.string().max(240),
        }).nullable().optional(),
        applyMode: z.enum(['auto-apply', 'manual-confirm']).nullable().optional(),
        language: z.string().max(10).nullable().optional(),
        translationId: z.string().max(255).nullable().optional(),
        postId: z.string().max(255).nullable().optional(),
        generatedAt: z.coerce.date().nullable().optional(),
    })).nullable().optional(),
    audio: z
        .object({
            url: z
                .string()
                .nullable()
                .optional()
                .refine((url) => isValidCustomUrl(url), {
                    message: 'Audio URL must be from a whitelisted domain or local path',
                }),
            duration: z.coerce.number().int().min(0).nullable().optional(),
            size: z.coerce.number().int().min(0).nullable().optional(),
            mimeType: z.string().max(100).nullable().optional(),
            language: z.string().max(10).nullable().optional(),
            translationId: z.string().max(255).nullable().optional(),
            postId: z.string().max(255).nullable().optional(),
            mode: z.enum(['speech', 'podcast']).nullable().optional(),
        })
        .optional(),
    tts: z
        .object({
            provider: z.string().max(50).nullable().optional(),
            voice: z.string().max(150).nullable().optional(),
            generatedAt: z.coerce.date().nullable().optional(),
            language: z.string().max(10).nullable().optional(),
            translationId: z.string().max(255).nullable().optional(),
            postId: z.string().max(255).nullable().optional(),
            mode: z.enum(['speech', 'podcast']).nullable().optional(),
        })
        .optional(),
    scaffold: z
        .object({
            outline: z.string().nullable().optional(),
            metadata: z.record(z.string(), z.unknown()).nullable().optional(),
        })
        .optional(),
    publish: z
        .object({
            intent: publishIntentSchema.nullable().optional(),
        })
        .optional(),
    integration: z
        .object({
            memosId: z.string().max(255).nullable().optional(),
            distribution: z
                .object({
                    channels: z
                        .object({
                            memos: distributionChannelStateSchema.nullable().optional(),
                            wechatsync: distributionChannelStateSchema.nullable().optional(),
                        })
                        .optional(),
                    timeline: z.array(distributionTimelineEntrySchema).nullable().optional(),
                })
                .nullable()
                .optional(),
        })
        .optional(),
})

const postTagBindingSchema = z.object({
    name: z.string().min(1).max(100),
    translationId: z.string().max(255).nullable().optional(),
    sourceTagSlug: z.string().max(100).nullable().optional(),
    sourceTagId: z.string().max(255).nullable().optional(),
})

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
    metaVersion: z.coerce.number().int().min(1).optional(),
    metadata: postMetadataSchema.nullable().optional(),
    translationId: z.string().max(255).nullable().optional(),
    category: z.string().nullable().optional(),
    categoryId: z.string().nullable().optional(),
    copyright: z.string().nullable().optional(),
    scaffoldOutline: z.string().nullable().optional(),
    scaffoldMetadata: z.record(z.string(), z.unknown()).nullable().optional(),
    publishIntent: publishIntentSchema.nullable().optional(),
    tags: z.array(z.string()).optional(),
    tagBindings: z.array(postTagBindingSchema).optional(),
    isPinned: z.boolean().optional(),
    status: postStatusEnum,
    visibility: postVisibilityEnum,
    password: z.string().nullable().optional(),
    pushOption: z.enum(['none', 'draft', 'now']).optional().default('none'),
    syncToMemos: z.boolean().optional().default(false),
    pushCriteria: publishIntentSchema.shape.pushCriteria,
}

export const createPostSchema = z.object({
    ...sharedPostFields,
    slug: sharedPostFields.slug.optional(),
    language: sharedPostFields.language.default('zh-CN'),
    status: sharedPostFields.status.default(PostStatus.DRAFT),
    visibility: sharedPostFields.visibility.default(PostVisibility.PUBLIC),
    createdAt: z.preprocess((val) => (val === null || val === '' ? undefined : val), z.coerce.date().optional()),
    publishedAt: z.preprocess((val) => (val === null || val === '' ? undefined : val), z.coerce.date().optional()),
    views: z.coerce.number().int().min(0).optional(),
})

export const updatePostSchema = z.object(sharedPostFields).partial().extend({
    slug: sharedPostFields.slug.optional(),
    createdAt: z.preprocess((val) => (val === null || val === '' ? undefined : val), z.coerce.date().optional()),
    publishedAt: z.preprocess((val) => (val === null || val === '' ? undefined : val), z.coerce.date().optional()),
    views: z.coerce.number().int().min(0).optional(),
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
    isPinned: booleanQueryValueSchema,
    excludeIds: stringArrayQuerySchema,
    orderBy: z.enum(['createdAt', 'updatedAt', 'views', 'publishedAt', 'title', 'status', 'isPinned']).default('publishedAt'),
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
