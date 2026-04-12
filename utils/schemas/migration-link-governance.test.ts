import { describe, it, expect } from 'vitest'
import { linkGovernanceSeedSchema, linkGovernanceRequestSchema } from './migration-link-governance'

const validSeed = {
    source: '/old-path/article',
    sourceKind: 'root-relative',
    matchMode: 'exact',
    scope: 'post-link',
    targetType: 'post',
    targetRef: { id: 'post-123' },
}

describe('linkGovernanceSeedSchema', () => {
    it('accepts valid seed', () => {
        expect(linkGovernanceSeedSchema.safeParse(validSeed).success).toBe(true)
    })

    it('rejects empty source', () => {
        expect(linkGovernanceSeedSchema.safeParse({ ...validSeed, source: '' }).success).toBe(false)
    })

    it('rejects invalid sourceKind', () => {
        expect(linkGovernanceSeedSchema.safeParse({ ...validSeed, sourceKind: 'invalid' }).success).toBe(false)
    })

    it('rejects invalid matchMode', () => {
        expect(linkGovernanceSeedSchema.safeParse({ ...validSeed, matchMode: 'contains' }).success).toBe(false)
    })

    it('rejects notes longer than 500 chars', () => {
        expect(linkGovernanceSeedSchema.safeParse({ ...validSeed, notes: 'a'.repeat(501) }).success).toBe(false)
    })

    it('accepts optional notes', () => {
        expect(linkGovernanceSeedSchema.safeParse({ ...validSeed, notes: 'A note' }).success).toBe(true)
    })
})

describe('linkGovernanceRequestSchema', () => {
    const validRequest = {
        scopes: ['post-link'],
    }

    it('accepts minimal valid request', () => {
        expect(linkGovernanceRequestSchema.safeParse(validRequest).success).toBe(true)
    })

    it('rejects empty scopes array', () => {
        expect(linkGovernanceRequestSchema.safeParse({ scopes: [] }).success).toBe(false)
    })

    it('rejects invalid scope', () => {
        expect(linkGovernanceRequestSchema.safeParse({ scopes: ['invalid'] }).success).toBe(false)
    })

    it('defaults options.reportFormat to json', () => {
        const result = linkGovernanceRequestSchema.safeParse({ ...validRequest, options: {} })
        if (result.success) {
            expect(result.data.options?.reportFormat).toBe('json')
        }
    })
})
