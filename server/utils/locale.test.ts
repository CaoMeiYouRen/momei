import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseCookies, getHeader, setCookie, getQuery, type H3Event } from 'h3'
import {
    normalizeLocale,
    parseAcceptLanguage,
    DEFAULT_LOCALE,
    getLocaleFromCookie,
    getLocaleFromHeaders,
    getLocaleFromQuery,
    detectUserLocale,
    getUserLocale,
    setLocaleCookie,
    toProjectLocale,
} from './locale'

// Mock h3 utils
vi.mock('h3', () => ({
    parseCookies: vi.fn(),
    getHeader: vi.fn(),
    setCookie: vi.fn(),
    getQuery: vi.fn(),
}))

describe('server/utils/locale.ts', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    describe('normalizeLocale', () => {
        it('should return direct match', () => {
            expect(normalizeLocale('zh-Hans')).toBe('zh-Hans')
            // 'default' is one of the supported locales
            expect(normalizeLocale('default')).toBe('default')
        })

        it('should handle case insensitivity', () => {
            expect(normalizeLocale('ZH-HANS')).toBe('zh-Hans')
        })

        it('should use mapping', () => {
            expect(normalizeLocale('zh-CN')).toBe('zh-Hans')
            expect(normalizeLocale('en-US')).toBe('en-US')
            expect(normalizeLocale('en')).toBe('en-US')
        })

        it('should use prefix match if mapping fails', () => {
            // 'fr-BE' is in mapping, but 'fr-XX' is not.
            // It should match 'fr-FR' prefix.
            expect(normalizeLocale('fr-XX')).toBe('fr-FR')
        })

        it('should return default for unknown', () => {
            expect(normalizeLocale('xx-XX')).toBe(DEFAULT_LOCALE)
        })

        it('should handle whitespace', () => {
            expect(normalizeLocale('  zh-CN  ')).toBe('zh-Hans')
        })
    })

    describe('parseAcceptLanguage', () => {
        it('should parse single language', () => {
            expect(parseAcceptLanguage('zh-CN')).toContain('zh-Hans')
        })

        it('should handle malformed accept-language', () => {
            // Empty parts or missing q
            const result = parseAcceptLanguage(',;q=0.5')
            expect(result).toContain(DEFAULT_LOCALE)
        })

        it('should parse multiple languages with q-values', () => {
            const result = parseAcceptLanguage('zh-CN;q=0.9, en;q=0.8')
            expect(result[0]).toBe('zh-Hans')
            expect(result[1]).toBe('en-US')
        })

        it('sort by q-value', () => {
            const result = parseAcceptLanguage('en;q=0.8, zh-CN;q=0.9')
            expect(result[0]).toBe('zh-Hans')
            expect(result[1]).toBe('en-US')
        })

        it('should return default if empty', () => {
            expect(parseAcceptLanguage('')).toEqual([DEFAULT_LOCALE])
        })

        it('should deduplicate results', () => {
            const result = parseAcceptLanguage('zh-CN, zh-sg')
            // Both map to zh-Hans
            expect(result.filter((l) => l === 'zh-Hans').length).toBe(1)
        })
    })

    describe('getLocaleFromCookie', () => {
        it('should return locale from cookie', () => {
            vi.mocked(parseCookies).mockReturnValue({ locale: 'zh-Hans' })
            const event = {} as H3Event
            expect(getLocaleFromCookie(event)).toBe('zh-Hans')
        })

        it('should check alternative cookie names', () => {
            vi.mocked(parseCookies).mockReturnValue({ language: 'en-US' })
            expect(getLocaleFromCookie({} as any)).toBe('en-US')

            vi.mocked(parseCookies).mockReturnValue({ lang: 'pt-PT' })
            expect(getLocaleFromCookie({} as any)).toBe('pt-PT')
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

        it('should handle errors', () => {
            vi.mocked(parseCookies).mockImplementation(() => {
                throw new Error('fail')
            })
            expect(getLocaleFromCookie({} as any)).toBeNull()
        })
    })

    describe('getLocaleFromHeaders', () => {
        it('should return locale from custom header', () => {
            vi.mocked(getHeader).mockImplementation((_, name) => {
                if (name === 'x-locale') {
                    return 'zh-Hans'
                }
                return undefined
            })
            const event = {} as H3Event
            expect(getLocaleFromHeaders(event)).toBe('zh-Hans')
        })

        it('should check multiple custom headers', () => {
            vi.mocked(getHeader).mockImplementation((_, name) => {
                if (name === 'x-lang') {
                    return 'pt-PT'
                }
                return undefined
            })
            expect(getLocaleFromHeaders({} as any)).toBe('pt-PT')
        })

        it('should return locale from accept-language', () => {
            vi.mocked(getHeader).mockImplementation((_, name) => {
                if (name === 'accept-language') {
                    return 'en-US'
                }
                return undefined
            })
            const event = {} as H3Event
            expect(getLocaleFromHeaders(event)).toBe('en-US')
        })

        it('should return default if no headers', () => {
            vi.mocked(getHeader).mockReturnValue(undefined)
            const event = {} as H3Event
            expect(getLocaleFromHeaders(event)).toBe(DEFAULT_LOCALE)
        })

        it('should handle errors', () => {
            vi.mocked(getHeader).mockImplementation(() => {
                throw new Error('fail')
            })
            expect(getLocaleFromHeaders({} as any)).toBe(DEFAULT_LOCALE)
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
            vi.mocked(getHeader).mockImplementation((_, name) => {
                if (name === 'accept-language') {
                    return 'en-US'
                }
                return undefined
            })
            const event = {} as H3Event
            expect(detectUserLocale(event)).toBe('en-US')
        })

        it('should handle errors', () => {
            vi.mocked(parseCookies).mockImplementation(() => {
                throw new Error('fatal')
            })
            expect(detectUserLocale({} as any)).toBe(DEFAULT_LOCALE)
        })
    })

    describe('setLocaleCookie', () => {
        it('should call h3 setCookie', () => {
            const event = {} as H3Event
            setLocaleCookie(event, 'zh-Hans')
            expect(setCookie).toHaveBeenCalledWith(event, 'locale', 'zh-Hans', expect.any(Object))
        })

        it('should use custom options', () => {
            const event = {} as H3Event
            setLocaleCookie(event, 'zh-Hans', { maxAge: 60 })
            expect(setCookie).toHaveBeenCalledWith(event, 'locale', 'zh-Hans', expect.objectContaining({ maxAge: 60 }))
        })

        it('should handle errors', () => {
            vi.mocked(setCookie).mockImplementation(() => {
                throw new Error('cookie fail')
            })
            // Should not throw
            expect(() => setLocaleCookie({} as any, 'zh-Hans')).not.toThrow()
        })
    })

    describe('getUserLocale', () => {
        it('should get locale from url', () => {
            const request = new Request('http://localhost/?locale=zh-Hans')
            expect(getUserLocale(request)).toBe('zh-Hans')
        })

        it('should check alternative query params', () => {
            const request = new Request('http://localhost/?lang=en-US')
            expect(getUserLocale(request)).toBe('en-US')

            const request2 = new Request('http://localhost/?language=fr-FR')
            expect(getUserLocale(request2)).toBe('fr-FR')
        })

        it('should get locale from cookie header', () => {
            const headers = new Headers()
            headers.set('cookie', 'locale=pt-BR')
            const request = {
                url: 'http://localhost/',
                headers,
            } as any
            expect(getUserLocale(request)).toBe('pt-BR')

            const headers2 = new Headers()
            headers2.set('cookie', 'lang=fr-FR')
            const request2 = {
                url: 'http://localhost/',
                headers: headers2,
            } as any
            expect(getUserLocale(request2)).toBe('fr-FR')

            const headers3 = new Headers()
            headers3.set('cookie', 'language=pt-PT')
            const request3 = {
                url: 'http://localhost/',
                headers: headers3,
            } as any
            expect(getUserLocale(request3)).toBe('pt-PT')

            // Partial cookie (key only)
            const headers4 = new Headers()
            headers4.set('cookie', 'locale=; other=1')
            const request4 = {
                url: 'http://localhost/',
                headers: headers4,
            } as any
            expect(getUserLocale(request4)).toBe(DEFAULT_LOCALE)
        })

        it('should handle multiple cookies in header', () => {
            const headers = new Headers()
            headers.set('cookie', 'a=1; locale=pt-PT')
            const request = {
                url: 'http://localhost/',
                headers,
            } as any
            expect(getUserLocale(request)).toBe('pt-PT')
        })

        it('should hit normalizeLocale fallback in cookie header', () => {
            const headers = new Headers()
            headers.set('cookie', 'locale=en-US')
            const request = {
                url: 'http://localhost/',
                headers,
            } as any
            expect(getUserLocale(request)).toBe('en-US')
        })

        it('should get locale from custom headers', () => {
            const headers = new Headers()
            headers.set('x-locale', 'zh-Hant')
            const request = {
                url: 'http://localhost/',
                headers,
            } as any
            expect(getUserLocale(request)).toBe('zh-Hant')

            const headers2 = new Headers()
            headers2.set('x-language', 'fr-FR')
            const request2 = {
                url: 'http://localhost/',
                headers: headers2,
            } as any
            expect(getUserLocale(request2)).toBe('fr-FR')

            const headers3 = new Headers()
            headers3.set('x-lang', 'zh-Hans')
            const request3 = {
                url: 'http://localhost/',
                headers: headers3,
            } as any
            expect(getUserLocale(request3)).toBe('zh-Hans')
        })

        it('should get locale from accept-language header', () => {
            const headers = new Headers()
            headers.set('accept-language', 'zh-CN')
            const request = {
                url: 'http://localhost/',
                headers,
            } as any
            expect(getUserLocale(request)).toBe('zh-Hans')
        })

        it('should return default if nothing found', () => {
            const request = new Request('http://localhost/')
            expect(getUserLocale(request)).toBe(DEFAULT_LOCALE)
        })

        it('should handle errors', () => {
            const request = { url: 'invalid' } as any
            expect(getUserLocale(request)).toBe(DEFAULT_LOCALE)
        })
    })

    describe('toProjectLocale', () => {
        it('should map zh-Hans to zh-CN', () => {
            expect(toProjectLocale('zh-Hans')).toBe('zh-CN')
        })

        it('should map default to en-US', () => {
            expect(toProjectLocale('default')).toBe('en-US')
        })

        it('should map en-US to en-US', () => {
            expect(toProjectLocale('en-US')).toBe('en-US')
        })

        it('should return original if no mapping', () => {
            expect(toProjectLocale('ja-JP')).toBe('ja-JP')
        })
    })

    describe('getLocaleFromQuery', () => {
        it('should return locale from query', () => {
            vi.mocked(getQuery).mockReturnValue({ lang: 'en-US' })
            expect(getLocaleFromQuery({} as H3Event)).toBe('en-US')
        })

        it('should return null if no query', () => {
            vi.mocked(getQuery).mockReturnValue({})
            expect(getLocaleFromQuery({} as H3Event)).toBeNull()
        })
    })
})
