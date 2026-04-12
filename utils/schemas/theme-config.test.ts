import { describe, it, expect } from 'vitest'
import { themeConfigSchema, themeConfigUpdateSchema } from './theme-config'

describe('themeConfigSchema', () => {
    const valid = {
        name: 'My Theme',
        configData: '{"dark":true}',
    }

    it('accepts valid input', () => {
        expect(themeConfigSchema.safeParse(valid).success).toBe(true)
    })

    it('rejects empty name', () => {
        expect(themeConfigSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
    })

    it('rejects name longer than 128 chars', () => {
        expect(themeConfigSchema.safeParse({ ...valid, name: 'a'.repeat(129) }).success).toBe(false)
    })

    it('rejects description longer than 1000 chars', () => {
        expect(themeConfigSchema.safeParse({ ...valid, description: 'a'.repeat(1001) }).success).toBe(false)
    })

    it('rejects empty configData', () => {
        expect(themeConfigSchema.safeParse({ ...valid, configData: '' }).success).toBe(false)
    })

    it('accepts optional nullable description', () => {
        expect(themeConfigSchema.safeParse({ ...valid, description: null }).success).toBe(true)
        expect(themeConfigSchema.safeParse({ ...valid, description: 'Nice' }).success).toBe(true)
    })
})

describe('themeConfigUpdateSchema', () => {
    it('accepts empty object (all optional)', () => {
        expect(themeConfigUpdateSchema.safeParse({}).success).toBe(true)
    })

    it('accepts partial update', () => {
        expect(themeConfigUpdateSchema.safeParse({ name: 'New Name' }).success).toBe(true)
    })
})
