import { z } from 'zod'

export const agreementBodySchema = z.object({
    type: z.enum(['user_agreement', 'privacy_policy']),
    language: z.string().min(1).default('zh-CN'),
    content: z.string().min(1),
    version: z.string().optional().nullable(),
    versionDescription: z.string().optional().nullable(),
    isMainVersion: z.boolean().optional().default(false),
})

export const agreementUpdateSchema = agreementBodySchema.partial().omit({ type: true, language: true })

export type AgreementBodyInput = z.infer<typeof agreementBodySchema>
export type AgreementUpdateInput = z.infer<typeof agreementUpdateSchema>
