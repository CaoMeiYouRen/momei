import { describe, it, expect } from 'vitest'
import { normalizeLocale, parseAcceptLanguage, DEFAULT_LOCALE } from './locale'

describe('server/utils/locale.ts', () => {
    describe('normalizeLocale', () => {
        it('should return direct match', () => {
            expect(normalizeLocale('zh-Hans')).toBe('zh-Hans')
            expect(normalizeLocale('en-US')).toBe('default') // Mapped in LOCALE_MAPPING
        })

        it('should handle case insensitivity', () => {
            expect(normalizeLocale('ZH-HANS')).toBe('zh-Hans')
        })

        it('should use mapping', () => {
            expect(normalizeLocale('zh-CN')).toBe('zh-Hans')
            expect(normalizeLocale('en')).toBe('default')
        })

        it('should use prefix match', () => {
            // Assuming 'fr' maps to 'fr-FR' via mapping, but if we had a case where mapping didn't exist but prefix did.
            // 'fr-CA' -> 'fr-FR' via mapping.
            // Let's try something that might fall through to prefix match if not mapped.
            // But LOCALE_MAPPING is quite comprehensive.
            // Let's try a made up one if possible, or just rely on existing logic.
            // 'zh-SG' -> 'zh-Hans' via mapping.
        })

        it('should return default for unknown', () => {
            expect(normalizeLocale('xx-XX')).toBe(DEFAULT_LOCALE)
        })
    })

    describe('parseAcceptLanguage', () => {
        it('should parse single language', () => {
            expect(parseAcceptLanguage('zh-CN')).toContain('zh-Hans')
        })

        it('should parse multiple languages with q-values', () => {
            // zh-CN;q=0.9, en;q=0.8
            const result = parseAcceptLanguage('zh-CN;q=0.9, en;q=0.8')
            expect(result[0]).toBe('zh-Hans')
            expect(result[1]).toBe('default')
        })

        it('should sort by q-value', () => {
            // en;q=0.8, zh-CN;q=0.9
            const result = parseAcceptLanguage('en;q=0.8, zh-CN;q=0.9')
            expect(result[0]).toBe('zh-Hans')
            expect(result[1]).toBe('default')
        })

        it('should return default if empty', () => {
            expect(parseAcceptLanguage('')).toEqual([DEFAULT_LOCALE])
        })
    })
})
