import { describe, it, expect } from 'vitest'
import { agreementAdminListQuerySchema, agreementBodySchema, agreementIdParamSchema, agreementUpdateSchema, agreementReviewStatusSchema } from './agreement'

describe('agreementBodySchema', () => {
    const valid = {
        type: 'user_agreement',
        content: 'Agreement content',
    }

    it('accepts valid input', () => {
        expect(agreementBodySchema.safeParse(valid).success).toBe(true)
    })

    it('defaults language to zh-CN', () => {
        const result = agreementBodySchema.safeParse(valid)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.language).toBe('zh-CN')
        }
    })

    it('rejects invalid type', () => {
        expect(agreementBodySchema.safeParse({ ...valid, type: 'invalid' }).success).toBe(false)
    })

    it('accepts privacy_policy type', () => {
        expect(agreementBodySchema.safeParse({ ...valid, type: 'privacy_policy' }).success).toBe(true)
    })

    it('rejects empty content', () => {
        expect(agreementBodySchema.safeParse({ ...valid, content: '' }).success).toBe(false)
    })
})

describe('agreementUpdateSchema', () => {
    it('accepts empty object (all optional)', () => {
        expect(agreementUpdateSchema.safeParse({}).success).toBe(true)
    })

    it('accepts partial update', () => {
        expect(agreementUpdateSchema.safeParse({ content: 'Updated content' }).success).toBe(true)
    })
})

describe('agreementReviewStatusSchema', () => {
    it('accepts approved status', () => {
        expect(agreementReviewStatusSchema.safeParse({ reviewStatus: 'approved' }).success).toBe(true)
    })

    it('accepts draft status', () => {
        expect(agreementReviewStatusSchema.safeParse({ reviewStatus: 'draft' }).success).toBe(true)
    })

    it('rejects invalid statuses', () => {
        expect(agreementReviewStatusSchema.safeParse({ reviewStatus: 'invalid' }).success).toBe(false)
    })
})

describe('agreementAdminListQuerySchema', () => {
    it('accepts valid agreement list query', () => {
        const result = agreementAdminListQuerySchema.safeParse({
            type: 'user_agreement',
            language: '  en-US  ',
        })

        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data).toEqual({
                type: 'user_agreement',
                language: 'en-US',
            })
        }
    })

    it('rejects invalid agreement type', () => {
        expect(agreementAdminListQuerySchema.safeParse({ type: 'invalid' }).success).toBe(false)
    })
})

describe('agreementIdParamSchema', () => {
    it('trims and accepts non-empty agreement id', () => {
        const result = agreementIdParamSchema.safeParse({ id: ' agreement-1 ' })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.id).toBe('agreement-1')
        }
    })

    it('rejects empty agreement id', () => {
        expect(agreementIdParamSchema.safeParse({ id: '   ' }).success).toBe(false)
    })
})
