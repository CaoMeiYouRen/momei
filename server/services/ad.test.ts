import { describe, it, expect } from 'vitest'
import { evaluateTargeting } from './ad'
import type { AdPlacement } from '@/server/entities/ad-placement'

function makePlacement(targeting?: AdPlacement['targeting']): AdPlacement {
    return { id: 'p1', targeting } as unknown as AdPlacement
}

describe('evaluateTargeting', () => {
    it('returns true when no targeting rules set', () => {
        expect(evaluateTargeting(makePlacement(undefined))).toBe(true)
        expect(evaluateTargeting(makePlacement(null as any))).toBe(true)
    })

    it('returns true when targeting has empty rules', () => {
        expect(evaluateTargeting(makePlacement({}))).toBe(true)
    })

    describe('locale targeting', () => {
        const placement = makePlacement({ locales: ['zh-CN', 'en-US'] })

        it('returns true when context locale matches', () => {
            expect(evaluateTargeting(placement, { locale: 'zh-CN' })).toBe(true)
        })

        it('returns false when context locale does not match', () => {
            expect(evaluateTargeting(placement, { locale: 'ja-JP' })).toBe(false)
        })

        it('returns false when no context locale provided', () => {
            expect(evaluateTargeting(placement, {})).toBe(false)
        })
    })

    describe('category targeting', () => {
        const placement = makePlacement({ categories: ['tech', 'news'] })

        it('returns true when context categories include a matching category', () => {
            expect(evaluateTargeting(placement, { categories: ['tech', 'life'] })).toBe(true)
        })

        it('returns false when no context categories match', () => {
            expect(evaluateTargeting(placement, { categories: ['life', 'travel'] })).toBe(false)
        })

        it('returns false when context has no categories', () => {
            expect(evaluateTargeting(placement, {})).toBe(false)
        })
    })

    describe('tag targeting', () => {
        const placement = makePlacement({ tags: ['vue', 'react'] })

        it('returns true when context tags include a matching tag', () => {
            expect(evaluateTargeting(placement, { tags: ['vue', 'typescript'] })).toBe(true)
        })

        it('returns false when no context tags match', () => {
            expect(evaluateTargeting(placement, { tags: ['angular'] })).toBe(false)
        })

        it('returns false when context has no tags', () => {
            expect(evaluateTargeting(placement, {})).toBe(false)
        })
    })

    it('requires all targeting rules to pass simultaneously', () => {
        const placement = makePlacement({
            locales: ['zh-CN'],
            categories: ['tech'],
        })
        // locale matches but categories missing → fail
        expect(evaluateTargeting(placement, { locale: 'zh-CN' })).toBe(false)
        // both match → pass
        expect(evaluateTargeting(placement, { locale: 'zh-CN', categories: ['tech'] })).toBe(true)
    })
})
