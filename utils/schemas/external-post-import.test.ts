import { describe, it, expect } from 'vitest'
import { externalPostImportSchema } from './external-post-import'

describe('externalPostImportSchema', () => {
    const basePost = { title: 'My Post', content: 'Hello world' }

    it('parses minimal valid input', () => {
        const result = externalPostImportSchema.safeParse(basePost)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.confirmPathAliases).toBe(false)
        }
    })

    it('trims and accepts abbrlink string', () => {
        const result = externalPostImportSchema.safeParse({ ...basePost, abbrlink: '  abc123  ' })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.abbrlink).toBe('abc123')
        }
    })

    it('converts empty abbrlink to undefined', () => {
        const result = externalPostImportSchema.safeParse({ ...basePost, abbrlink: '   ' })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.abbrlink).toBeUndefined()
        }
    })

    it('converts null abbrlink to undefined', () => {
        const result = externalPostImportSchema.safeParse({ ...basePost, abbrlink: null })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.abbrlink).toBeUndefined()
        }
    })

    it('accepts permalink', () => {
        const result = externalPostImportSchema.safeParse({ ...basePost, permalink: '/my-post' })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.permalink).toBe('/my-post')
        }
    })

    it('accepts sourceFile', () => {
        const result = externalPostImportSchema.safeParse({ ...basePost, sourceFile: 'posts/my-post.md' })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.sourceFile).toBe('posts/my-post.md')
        }
    })

    it('sets confirmPathAliases true when provided', () => {
        const result = externalPostImportSchema.safeParse({ ...basePost, confirmPathAliases: true })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.confirmPathAliases).toBe(true)
        }
    })

    it('fails when title is missing', () => {
        const result = externalPostImportSchema.safeParse({ content: 'Hello' })
        expect(result.success).toBe(false)
    })
})
