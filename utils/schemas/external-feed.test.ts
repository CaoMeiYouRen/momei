import { describe, it, expect } from 'vitest'
import { externalFeedSourceConfigSchema, externalFeedSourcesSchema } from './external-feed'

const validFeed = {
    id: 'feed-1',
    provider: 'rss',
    title: 'Test Feed',
    sourceUrl: 'https://example.com/rss.xml',
}

describe('externalFeedSourceConfigSchema', () => {
    it('accepts valid minimal feed config', () => {
        expect(externalFeedSourceConfigSchema.safeParse(validFeed).success).toBe(true)
    })

    it('defaults enabled to true', () => {
        const result = externalFeedSourceConfigSchema.safeParse(validFeed)
        if (result.success) {
            expect(result.data.enabled).toBe(true)
        }
    })

    it('defaults localeStrategy to inherit-current', () => {
        const result = externalFeedSourceConfigSchema.safeParse(validFeed)
        if (result.success) {
            expect(result.data.localeStrategy).toBe('inherit-current')
        }
    })

    it('defaults includeInHome to true', () => {
        const result = externalFeedSourceConfigSchema.safeParse(validFeed)
        if (result.success) {
            expect(result.data.includeInHome).toBe(true)
        }
    })

    it('rejects empty title', () => {
        expect(externalFeedSourceConfigSchema.safeParse({ ...validFeed, title: '' }).success).toBe(false)
    })

    it('rejects invalid sourceUrl', () => {
        expect(externalFeedSourceConfigSchema.safeParse({ ...validFeed, sourceUrl: 'not-url' }).success).toBe(false)
    })

    it('rejects invalid provider', () => {
        expect(externalFeedSourceConfigSchema.safeParse({ ...validFeed, provider: 'twitter' }).success).toBe(false)
    })

    it('accepts rsshub provider', () => {
        expect(externalFeedSourceConfigSchema.safeParse({ ...validFeed, provider: 'rsshub' }).success).toBe(true)
    })

    it('rejects priority outside -100..100', () => {
        expect(externalFeedSourceConfigSchema.safeParse({ ...validFeed, priority: 200 }).success).toBe(false)
        expect(externalFeedSourceConfigSchema.safeParse({ ...validFeed, priority: -200 }).success).toBe(false)
    })

    it('rejects maxItems > 20', () => {
        expect(externalFeedSourceConfigSchema.safeParse({ ...validFeed, maxItems: 25 }).success).toBe(false)
    })
})

describe('externalFeedSourcesSchema', () => {
    it('accepts empty array', () => {
        expect(externalFeedSourcesSchema.safeParse([]).success).toBe(true)
    })

    it('rejects array with more than 20 items', () => {
        const items = Array.from({ length: 21 }, (_, i) => ({ ...validFeed, id: `feed-${i}` }))
        expect(externalFeedSourcesSchema.safeParse(items).success).toBe(false)
    })
})
