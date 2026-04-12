import { describe, it, expect } from 'vitest'
import { aiQuotaPolicySchema, aiQuotaPoliciesSchema, aiAlertThresholdsSchema, aiCostFactorsSchema } from './ai'

describe('aiQuotaPolicySchema', () => {
    const valid = {
        subjectType: 'global',
        subjectValue: 'all',
        scope: 'all',
        period: 'month',
    }

    it('accepts valid global policy with defaults', () => {
        const result = aiQuotaPolicySchema.safeParse(valid)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.isExempt).toBe(false)
            expect(result.data.enabled).toBe(true)
        }
    })

    it('rejects empty subjectValue', () => {
        expect(aiQuotaPolicySchema.safeParse({ ...valid, subjectValue: '' }).success).toBe(false)
    })

    it('rejects invalid subjectType', () => {
        expect(aiQuotaPolicySchema.safeParse({ ...valid, subjectType: 'admin' }).success).toBe(false)
    })

    it('rejects invalid scope', () => {
        expect(aiQuotaPolicySchema.safeParse({ ...valid, scope: 'video' }).success).toBe(false)
    })

    it('accepts scope with "type:" prefix', () => {
        expect(aiQuotaPolicySchema.safeParse({ ...valid, scope: 'type:summarize' }).success).toBe(true)
    })

    it('rejects invalid period', () => {
        expect(aiQuotaPolicySchema.safeParse({ ...valid, period: 'year' }).success).toBe(false)
    })
})

describe('aiQuotaPoliciesSchema', () => {
    it('accepts empty array', () => {
        expect(aiQuotaPoliciesSchema.safeParse([]).success).toBe(true)
    })
})

describe('aiAlertThresholdsSchema', () => {
    it('accepts empty object with all defaults', () => {
        const result = aiAlertThresholdsSchema.safeParse({})
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.enabled).toBe(true)
            expect(result.data.quotaUsageRatios).toEqual([0.5, 0.8, 1])
        }
    })

    it('rejects ratio >1', () => {
        expect(aiAlertThresholdsSchema.safeParse({ quotaUsageRatios: [1.5] }).success).toBe(false)
    })

    it('rejects ratio <=0', () => {
        expect(aiAlertThresholdsSchema.safeParse({ quotaUsageRatios: [0] }).success).toBe(false)
    })
})

describe('aiCostFactorsSchema', () => {
    it('accepts empty object with defaults', () => {
        const result = aiCostFactorsSchema.safeParse({})
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.currencyCode).toBe('CNY')
            expect(result.data.currencySymbol).toBe('¥')
            expect(result.data.quotaUnitPrice).toBe(0.1)
        }
    })

    it('rejects negative quotaUnitPrice', () => {
        expect(aiCostFactorsSchema.safeParse({ quotaUnitPrice: -1 }).success).toBe(false)
    })
})
