import { describe, it, expect } from 'vitest'
import { agreementBodySchema, agreementUpdateSchema, agreementReviewStatusSchema } from './agreement'

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
