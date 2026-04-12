import { describe, it, expect } from 'vitest'
import { generateShortCode, isValidUrl, isBlacklistedUrl, extractFaviconUrl } from './link'

describe('link service (pure functions)', () => {
    describe('generateShortCode', () => {
        it('generates a code of default length 6', () => {
            const code = generateShortCode()
            expect(code).toHaveLength(6)
        })

        it('generates a code of specified length', () => {
            expect(generateShortCode(4)).toHaveLength(4)
            expect(generateShortCode(8)).toHaveLength(8)
        })

        it('only contains alphanumeric characters', () => {
            const code = generateShortCode(20)
            expect(code).toMatch(/^[0-9a-zA-Z]+$/)
        })

        it('generates unique codes on successive calls', () => {
            const codes = new Set(Array.from({ length: 50 }, () => generateShortCode()))
            expect(codes.size).toBeGreaterThan(45)
        })
    })

    describe('isValidUrl', () => {
        it('returns true for valid http URL', () => {
            expect(isValidUrl('http://example.com')).toBe(true)
        })

        it('returns true for valid https URL', () => {
            expect(isValidUrl('https://example.com/path?q=1')).toBe(true)
        })

        it('returns false for ftp URL', () => {
            expect(isValidUrl('ftp://example.com')).toBe(false)
        })

        it('returns false for non-URL string', () => {
            expect(isValidUrl('not-a-url')).toBe(false)
            expect(isValidUrl('')).toBe(false)
        })

        it('returns false for javascript: protocol', () => {
            expect(isValidUrl('javascript:alert(1)')).toBe(false)
        })
    })

    describe('isBlacklistedUrl', () => {
        it('returns false when URL is not on blacklist', () => {
            expect(isBlacklistedUrl('https://example.com', ['bad.com', 'evil.org'])).toBe(false)
        })

        it('returns true when hostname exactly matches blacklist', () => {
            expect(isBlacklistedUrl('https://bad.com/path', ['bad.com'])).toBe(true)
        })

        it('returns true for subdomains of blacklisted domain', () => {
            expect(isBlacklistedUrl('https://sub.bad.com', ['bad.com'])).toBe(true)
        })

        it('returns false when only suffix matches (not subdomain)', () => {
            expect(isBlacklistedUrl('https://notbad.com', ['bad.com'])).toBe(false)
        })

        it('returns true for invalid URL (cannot be parsed)', () => {
            expect(isBlacklistedUrl('not-a-url', [])).toBe(true)
        })

        it('returns false with empty blacklist', () => {
            expect(isBlacklistedUrl('https://example.com', [])).toBe(false)
        })

        it('is case-insensitive for comparison', () => {
            expect(isBlacklistedUrl('https://BAD.COM', ['bad.com'])).toBe(true)
        })
    })

    describe('extractFaviconUrl', () => {
        it('extracts favicon URL from valid https URL', () => {
            expect(extractFaviconUrl('https://example.com/page')).toBe('https://example.com/favicon.ico')
        })

        it('extracts favicon URL from valid http URL', () => {
            expect(extractFaviconUrl('http://sub.example.com/path')).toBe('http://sub.example.com/favicon.ico')
        })

        it('returns empty string for invalid URL', () => {
            expect(extractFaviconUrl('not-a-url')).toBe('')
        })
    })
})
