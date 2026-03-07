import { z } from 'zod'

const aiQuotaScopeSchema = z.string().trim().refine((value) => {
    return value === 'all'
        || ['text', 'image', 'asr', 'tts', 'podcast'].includes(value)
        || value.startsWith('type:')
}, {
    message: 'Invalid AI quota scope',
})

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

export const aiTranslateSchema = z.object({
    content: z.string().min(1),
    targetLanguage: z.string().min(2).max(10),
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

export const aiGenerateImageSchema = z.object({
    prompt: z.string().min(1).max(1000),
    model: z.string().optional(),
    size: z.string().optional(),
    aspectRatio: z.string().optional(),
    quality: z.enum(['standard', 'hd']).optional().default('standard'),
    style: z.enum(['vivid', 'natural']).optional().default('vivid'),
    n: z.number().int().min(1).max(4).optional().default(1),
})

export type AiTranslateInput = z.infer<typeof aiTranslateSchema>
export type AiSummarizeInput = z.infer<typeof aiSummarizeSchema>
