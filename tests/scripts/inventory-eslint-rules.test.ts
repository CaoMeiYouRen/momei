import { describe, expect, it } from 'vitest'
import { isCandidateRule, normalizeSeverity } from '../../scripts/governance/inventory-eslint-rules.mjs'

describe('inventory-eslint-rules - normalizeSeverity', () => {
    it('归一化字符串与数组形态的规则级别', () => {
        expect(normalizeSeverity('off')).toBe(0)
        expect(normalizeSeverity('warn')).toBe(1)
        expect(normalizeSeverity('error')).toBe(2)
        expect(normalizeSeverity([0])).toBe(0)
        expect(normalizeSeverity([1, { minimumDescriptionLength: 10 }])).toBe(1)
    })

    it('缺省与未知形态按关闭处理', () => {
        expect(normalizeSeverity(undefined)).toBe(0)
        expect(normalizeSeverity({})).toBe(0)
    })
})

describe('inventory-eslint-rules - isCandidateRule', () => {
    it('仅配置值与生效值均为 0 时视为候选', () => {
        expect(isCandidateRule({ configuredSeverity: 0, effectiveSeverity: 0 })).toBe(true)
        expect(isCandidateRule({ configuredSeverity: 0, effectiveSeverity: 1 })).toBe(false)
        expect(isCandidateRule({ configuredSeverity: 1, effectiveSeverity: 1 })).toBe(false)
    })
})
