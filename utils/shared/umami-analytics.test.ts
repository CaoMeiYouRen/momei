import { describe, expect, it } from 'vitest'
import {
    DEFAULT_UMAMI_SCRIPT_URL,
    parseUmamiAnalyticsOptions,
    stringifyUmamiAnalyticsOptions,
} from './umami-analytics'

describe('umami-analytics shared utils', () => {
    describe('parseUmamiAnalyticsOptions', () => {
        it('returns null for non-string input', () => {
            expect(parseUmamiAnalyticsOptions(null)).toBeNull()
            expect(parseUmamiAnalyticsOptions(undefined)).toBeNull()
            expect(parseUmamiAnalyticsOptions({ websiteId: 'x' })).toBeNull()
        })

        it('returns null for blank string input', () => {
            expect(parseUmamiAnalyticsOptions('')).toBeNull()
            expect(parseUmamiAnalyticsOptions('   ')).toBeNull()
        })

        it('parses json payload and trims values', () => {
            expect(parseUmamiAnalyticsOptions('{"websiteId":"  website-id  ","scriptUrl":"  https://a.com/script.js  "}')).toEqual({
                websiteId: 'website-id',
                scriptUrl: 'https://a.com/script.js',
            })
        })

        it('uses default script url when json payload misses scriptUrl', () => {
            expect(parseUmamiAnalyticsOptions('{"websiteId":"website-id"}')).toEqual({
                websiteId: 'website-id',
                scriptUrl: DEFAULT_UMAMI_SCRIPT_URL,
            })
        })

        it('returns null when json payload misses websiteId', () => {
            expect(parseUmamiAnalyticsOptions('{"scriptUrl":"https://a.com/script.js"}')).toBeNull()
            expect(parseUmamiAnalyticsOptions('{"websiteId":"  "}')).toBeNull()
        })

        it('falls back to legacy plain websiteId format when raw is non-json', () => {
            expect(parseUmamiAnalyticsOptions('legacy-website-id')).toEqual({
                websiteId: 'legacy-website-id',
                scriptUrl: DEFAULT_UMAMI_SCRIPT_URL,
            })
        })
    })

    describe('stringifyUmamiAnalyticsOptions', () => {
        it('returns empty string when websiteId is missing', () => {
            expect(stringifyUmamiAnalyticsOptions({ websiteId: '' })).toBe('')
            expect(stringifyUmamiAnalyticsOptions({ websiteId: '   ' })).toBe('')
            expect(stringifyUmamiAnalyticsOptions({})).toBe('')
        })

        it('stringifies with trimmed values and default script url', () => {
            expect(stringifyUmamiAnalyticsOptions({
                websiteId: '  website-id  ',
            })).toBe('{"websiteId":"website-id","scriptUrl":"https://analytics.umami.is/script.js"}')
        })

        it('stringifies with explicit script url', () => {
            expect(stringifyUmamiAnalyticsOptions({
                websiteId: 'website-id',
                scriptUrl: '  https://a.com/script.js  ',
            })).toBe('{"websiteId":"website-id","scriptUrl":"https://a.com/script.js"}')
        })
    })
})
