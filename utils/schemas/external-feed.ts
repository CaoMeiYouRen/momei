import { z } from 'zod'

export const externalFeedProviderSchema = z.enum(['rss', 'rsshub'])

export const externalFeedLocaleStrategySchema = z.enum(['inherit-current', 'fixed', 'all'])

export const externalFeedSourceConfigSchema = z.object({
    id: z.string().trim().min(1).max(64),
    enabled: z.boolean().optional().default(true),
    provider: externalFeedProviderSchema,
    title: z.string().trim().min(1).max(120),
    sourceUrl: z.url(),
    siteUrl: z.url().optional().nullable(),
    siteName: z.string().trim().max(120).optional().nullable(),
    defaultLocale: z.string().trim().min(1).max(16).optional().nullable(),
    localeStrategy: externalFeedLocaleStrategySchema.optional().default('inherit-current'),
    includeInHome: z.boolean().optional().default(true),
    badgeLabel: z.string().trim().max(32).optional().nullable(),
    priority: z.number().int().min(-100).max(100).optional().default(0),
    timeoutMs: z.number().int().min(1000).max(8000).optional().nullable(),
    cacheTtlSeconds: z.number().int().min(60).max(86400).optional().nullable(),
    staleWhileErrorSeconds: z.number().int().min(60).max(604800).optional().nullable(),
    maxItems: z.number().int().min(1).max(20).optional().nullable(),
})

export const externalFeedSourcesSchema = z.array(externalFeedSourceConfigSchema).max(20)

export type ExternalFeedSourceConfigInput = z.infer<typeof externalFeedSourceConfigSchema>
