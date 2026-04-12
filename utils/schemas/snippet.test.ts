import { describe, it, expect } from 'vitest'
import { snippetBodySchema, snippetUpdateSchema } from './snippet'

describe('snippetBodySchema', () => {
    const valid = {
        content: 'Something meaningful',
    }

    it('accepts valid content', () => {
        expect(snippetBodySchema.safeParse(valid).success).toBe(true)
    })

    it('rejects empty content', () => {
        expect(snippetBodySchema.safeParse({ content: '' }).success).toBe(false)
    })

    it('accepts optional media array', () => {
        const result = snippetBodySchema.safeParse({ ...valid, media: ['url1', 'url2'] })
        expect(result.success).toBe(true)
    })

    it('defaults source to "web"', () => {
        const result = snippetBodySchema.safeParse(valid)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.source).toBe('web')
        }
    })

    it('defaults status to INBOX', () => {
        const result = snippetBodySchema.safeParse(valid)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.status).toBe('inbox')
        }
    })

    it('rejects source longer than 50 chars', () => {
        expect(snippetBodySchema.safeParse({ ...valid, source: 'a'.repeat(51) }).success).toBe(false)
    })
})

describe('snippetUpdateSchema', () => {
    it('accepts empty object (all fields optional)', () => {
        expect(snippetUpdateSchema.safeParse({}).success).toBe(true)
    })

    it('accepts partial update', () => {
        const result = snippetUpdateSchema.safeParse({ content: 'Updated content' })
        expect(result.success).toBe(true)
    })
})
