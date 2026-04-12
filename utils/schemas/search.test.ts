import { describe, it, expect } from 'vitest'
import { searchQuerySchema } from './search'

describe('searchQuerySchema', () => {
    it('parses valid search query with defaults', () => {
        const result = searchQuerySchema.safeParse({ page: '1', limit: '10' })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.sortBy).toBe('relevance')
        }
    })

    it('accepts q string', () => {
        const result = searchQuerySchema.safeParse({ q: 'hello world' })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.q).toBe('hello world')
        }
    })

    it('rejects q with empty string after trim', () => {
        const result = searchQuerySchema.safeParse({ q: '   ' })
        expect(result.success).toBe(false)
    })

    it('normalizes single string tags to array', () => {
        const result = searchQuerySchema.safeParse({ tags: 'vue' })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.tags).toEqual(['vue'])
        }
    })

    it('accepts tags as array of strings', () => {
        const result = searchQuerySchema.safeParse({ tags: ['vue', 'react'] })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.tags).toEqual(['vue', 'react'])
        }
    })

    it('returns empty tags for null/undefined', () => {
        const result = searchQuerySchema.safeParse({ tags: null })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.tags).toEqual([])
        }
    })

    it('validates sortBy enum', () => {
        expect(searchQuerySchema.safeParse({ sortBy: 'relevance' }).success).toBe(true)
        expect(searchQuerySchema.safeParse({ sortBy: 'publishedAt' }).success).toBe(true)
        expect(searchQuerySchema.safeParse({ sortBy: 'views' }).success).toBe(true)
        expect(searchQuerySchema.safeParse({ sortBy: 'invalid' }).success).toBe(false)
    })
})
