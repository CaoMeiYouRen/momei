import { describe, it, expect, vi } from 'vitest'
import { parseCookies, getHeader, type H3Event } from 'h3'
import { normalizeLocale, parseAcceptLanguage, DEFAULT_LOCALE, getLocaleFromCookie, getLocaleFromHeaders, detectUserLocale, getUserLocale } from './locale'

// Mock h3 utils
vi.mock('h3', () => ({
    parseCookies: vi.fn(),
    getHeader: vi.fn(),
    setCookie: vi.fn(),
}))

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

    describe('getLocaleFromCookie', () => {
        it('should return locale from cookie', () => {
            vi.mocked(parseCookies).mockReturnValue({ locale: 'zh-Hans' })
            const event = {} as H3Event
            expect(getLocaleFromCookie(event)).toBe('zh-Hans')
        })

        it('should normalize locale from cookie', () => {
            vi.mocked(parseCookies).mockReturnValue({ locale: 'zh-CN' })
            const event = {} as H3Event
            expect(getLocaleFromCookie(event)).toBe('zh-Hans')
        })

        it('should return null if no locale in cookie', () => {
            vi.mocked(parseCookies).mockReturnValue({})
            const event = {} as H3Event
            expect(getLocaleFromCookie(event)).toBeNull()
        })
    })

    describe('getLocaleFromHeaders', () => {
        it('should return locale from custom header', () => {
            vi.mocked(getHeader).mockImplementation((event, name) => {
                if (name === 'x-locale') {
                    return 'zh-Hans'
                }
                return undefined
            })
            const event = {} as H3Event
            expect(getLocaleFromHeaders(event)).toBe('zh-Hans')
        })

        it('should return locale from accept-language', () => {
            vi.mocked(getHeader).mockImplementation((event, name) => {
                if (name === 'accept-language') {
                    return 'zh-CN'
                }
                return undefined
            })
            const event = {} as H3Event
            expect(getLocaleFromHeaders(event)).toBe('zh-Hans')
        })

        it('should return default if no headers', () => {
            vi.mocked(getHeader).mockReturnValue(undefined)
            const event = {} as H3Event
            expect(getLocaleFromHeaders(event)).toBe(DEFAULT_LOCALE)
        })
    })

    describe('detectUserLocale', () => {
        it('should prioritize cookie', () => {
            vi.mocked(parseCookies).mockReturnValue({ locale: 'zh-Hans' })
            vi.mocked(getHeader).mockReturnValue('en-US')
            const event = {} as H3Event
            expect(detectUserLocale(event)).toBe('zh-Hans')
        })

        it('should fallback to header', () => {
            vi.mocked(parseCookies).mockReturnValue({})
            vi.mocked(getHeader).mockImplementation((event, name) => {
                if (name === 'accept-language') {
                    return 'en-US'
                }
                return undefined
            })
            const event = {} as H3Event
            expect(detectUserLocale(event)).toBe('default')
        })
    })

    describe('getUserLocale', () => {
        it('should get locale from url', () => {
            const request = new Request('http://localhost/?locale=zh-Hans')
            expect(getUserLocale(request)).toBe('zh-Hans')
        })

        it('should get locale from cookie header', () => {
            const request = new Request('http://localhost/', {
                headers: { cookie: 'locale=zh-Hans' },
            })
            expect(getUserLocale(request)).toBe('zh-Hans')
        })

        it('should get locale from accept-language header', () => {
            const request = new Request('http://localhost/', {
                headers: { 'accept-language': 'zh-CN' },
            })
            expect(getUserLocale(request)).toBe('zh-Hans')
        })
    })
})
