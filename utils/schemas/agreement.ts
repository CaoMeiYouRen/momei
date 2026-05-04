import { z } from 'zod'

const optionalAgreementLanguageSchema = z.preprocess(
    (value) => {
        if (typeof value !== 'string') {
            return value
        }

        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : undefined
    },
    z.string().max(10).optional(),
)

export const agreementBodySchema = z.object({
    type: z.enum(['user_agreement', 'privacy_policy']),
    language: z.string().min(1).default('zh-CN'),
    content: z.string().min(1),
    version: z.string().optional().nullable(),
    versionDescription: z.string().optional().nullable(),
    sourceAgreementId: z.string().optional().nullable(),
})

export const agreementUpdateSchema = agreementBodySchema.partial().omit({ type: true, language: true })

export const agreementTypeParamSchema = z.object({
    id: z.enum(['user_agreement', 'privacy_policy']),
})

export const agreementIdParamSchema = z.object({
    id: z.string().trim().min(1),
})

export const agreementAdminListQuerySchema = z.object({
    type: z.enum(['user_agreement', 'privacy_policy']),
    language: optionalAgreementLanguageSchema,
})

export const setActiveAgreementSchema = z.object({
    agreementId: z.string().min(1),
})

export const agreementReviewStatusSchema = z.object({
    reviewStatus: z.enum(['draft', 'pending_review', 'approved']),
})

export type AgreementBodyInput = z.infer<typeof agreementBodySchema>
export type AgreementUpdateInput = z.infer<typeof agreementUpdateSchema>
export type AgreementAdminListQueryInput = z.infer<typeof agreementAdminListQuerySchema>
export type AgreementIdParamInput = z.infer<typeof agreementIdParamSchema>
export type AgreementTypeParamInput = z.infer<typeof agreementTypeParamSchema>
export type AgreementReviewStatusInput = z.infer<typeof agreementReviewStatusSchema>
