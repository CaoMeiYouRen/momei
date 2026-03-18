import { z } from 'zod'
import { PostStatus } from '@/types/post'
import { SettingKey } from '@/types/setting'

const aiQuotaScopeSchema = z.string().trim().refine((value) => value === 'all'
    || ['text', 'image', 'asr', 'tts', 'podcast'].includes(value)
    || value.startsWith('type:'), {
    message: 'Invalid AI quota scope',
})

const aiAlertRatioSchema = z.number().gt(0).lte(1)

const aiAlertCategorySchema = z.enum(['all', 'text', 'image', 'asr', 'tts', 'podcast'])

const aiCurrencyCodeSchema = z.string().trim().min(1).max(8)

export const aiQuotaPolicySchema = z.object({
    subjectType: z.enum(['global', 'role', 'trust_level', 'user']),
    subjectValue: z.string().trim().min(1),
    scope: aiQuotaScopeSchema,
    period: z.enum(['day', 'month']),
    maxRequests: z.number().int().min(0).optional(),
    maxQuotaUnits: z.number().min(0).optional(),
    maxActualCost: z.number().min(0).optional(),
    maxConcurrentHeavyTasks: z.number().int().min(0).optional(),
    isExempt: z.boolean().optional().default(false),
    enabled: z.boolean().optional().default(true),
})

export const aiQuotaPoliciesSchema = z.array(aiQuotaPolicySchema)

export const aiAlertThresholdsSchema = z.object({
    enabled: z.boolean().optional().default(true),
    quotaUsageRatios: z.array(aiAlertRatioSchema).min(1).optional().default([0.5, 0.8, 1]),
    costUsageRatios: z.array(aiAlertRatioSchema).min(1).optional().default([0.8, 1]),
    failureBurst: z.object({
        enabled: z.boolean().optional().default(true),
        windowMinutes: z.number().int().min(1).max(1440).optional().default(10),
        maxFailures: z.number().int().min(1).max(1000).optional().default(3),
        categories: z.array(aiAlertCategorySchema).min(1).optional().default(['image', 'asr', 'tts', 'podcast']),
    }).optional().default({
        enabled: true,
        windowMinutes: 10,
        maxFailures: 3,
        categories: ['image', 'asr', 'tts', 'podcast'],
    }),
    dedupeWindowMinutes: z.number().int().min(1).max(44640).optional().default(1440),
    maxAlerts: z.number().int().min(1).max(100).optional().default(10),
})

export const aiCostFactorsSchema = z.object({
    currencyCode: aiCurrencyCodeSchema.optional().default('CNY'),
    currencySymbol: z.string().trim().min(1).max(8).optional().default('¥'),
    quotaUnitPrice: z.number().min(0).optional().default(0.1),
    exchangeRates: z.record(z.string().trim().min(1).max(8), z.number().positive()).optional().default({
        CNY: 1,
        USD: 7.2,
    }),
    providerCurrencies: z.record(z.string().trim().min(1).max(64), aiCurrencyCodeSchema).optional().default({
        openai: 'USD',
        anthropic: 'USD',
        gemini: 'USD',
        groq: 'USD',
        siliconflow: 'CNY',
        volcengine: 'CNY',
        doubao: 'CNY',
        deepseek: 'CNY',
    }),
})

export const aiTranslateSchema = z.object({
    content: z.string().min(1),
    targetLanguage: z.string().min(2).max(10),
    sourceLanguage: z.string().min(2).max(10).optional(),
    field: z.enum(['title', 'content', 'summary']).optional(),
})

export const aiTranslateNameSchema = z.object({
    name: z.string().min(1),
    to: z.string().min(1),
})

export const aiSummarizeSchema = z.object({
    content: z.string().min(1),
    maxLength: z.number().optional().default(200),
})

export const aiSuggestTitlesSchema = z.object({
    content: z.string().min(1),
    count: z.number().optional().default(5),
})

export const aiSuggestSlugSchema = z.object({
    title: z.string().min(1),
    content: z.string().optional(),
})

export const aiSuggestSlugFromNameSchema = z.object({
    name: z.string().min(1),
})

export const aiSnippetsAggregateSchema = z.object({
    snippets: z.array(z.string()).min(1),
    targetLanguage: z.string().default('zh-CN'),
})

export const aiScaffoldGenerateSchema = z.object({
    topic: z.string().min(1),
    language: z.string().default('zh-CN'),
})

export const aiScaffoldExpandSectionSchema = z.object({
    sectionTitle: z.string().min(1),
    context: z.string().optional(),
    language: z.string().default('zh-CN'),
})

export const aiRecommendTagsSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
})

export const aiRecommendTagsExternalSchema = z.object({
    content: z.string().min(1),
    existingTags: z.array(z.string()).optional().default([]),
    language: z.string().min(2).max(10).optional().default('zh-CN'),
})

export const aiRecommendCategoriesExternalSchema = z.object({
    postId: z.string().min(1),
    targetLanguage: z.string().min(2).max(10),
    sourceLanguage: z.string().min(2).max(10).optional(),
    limit: z.number().int().min(1).max(10).optional().default(5),
})

export const aiTranslatePostSchema = z.object({
    sourcePostId: z.string().min(1),
    targetLanguage: z.string().min(2).max(10),
    sourceLanguage: z.string().min(2).max(10).optional(),
    targetPostId: z.string().min(1).nullable().optional(),
    scopes: z.array(z.enum(['title', 'content', 'summary', 'category', 'tags', 'coverImage', 'audio'])).min(1).optional(),
    targetStatus: z.enum([PostStatus.DRAFT, PostStatus.PENDING]).optional(),
    slugStrategy: z.enum(['source', 'translate', 'ai']).optional().default('source'),
    categoryStrategy: z.enum(['cluster', 'suggest']).optional().default('cluster'),
    confirmationMode: z.enum(['auto', 'require', 'confirmed']).optional().default('auto'),
    previewTaskId: z.string().min(1).optional(),
    approvedSlug: z.string().min(1).nullable().optional(),
    approvedCategoryId: z.string().min(1).nullable().optional(),
})

export const aiLocalizedSettingDraftSchema = z.object({
    key: z.nativeEnum(SettingKey),
    targetLocale: z.string().min(2).max(10),
    sourceLocale: z.string().min(2).max(10).nullable().optional(),
    value: z.any().optional(),
})

export const aiAgreementDraftSchema = z.object({
    type: z.enum(['user_agreement', 'privacy_policy']),
    sourceAgreementId: z.string().min(1),
    targetLanguage: z.string().min(2).max(10),
    version: z.string().max(32).nullable().optional(),
    versionDescription: z.string().max(500).nullable().optional(),
})

export const aiGenerateImageSchema = z.object({
    prompt: z.string().min(1).max(1000),
    postId: z.string().min(1).max(64).optional(),
    targetLanguage: z.string().min(1).max(10).optional(),
    translationId: z.string().min(1).max(255).nullable().optional(),
    applyToPost: z.boolean().optional().default(true),
    overwriteExistingCover: z.boolean().optional().default(true),
    model: z.string().optional(),
    size: z.string().optional(),
    aspectRatio: z.string().optional(),
    quality: z.enum(['standard', 'hd']).optional().default('standard'),
    style: z.enum(['vivid', 'natural']).optional().default('vivid'),
    n: z.number().int().min(1).max(4).optional().default(1),
})

export type AiTranslateInput = z.infer<typeof aiTranslateSchema>
export type AiSummarizeInput = z.infer<typeof aiSummarizeSchema>
