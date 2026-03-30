import { describe, expect, it } from 'vitest'
import { buildAbsoluteUrl, ensureTrailingSlash, isAbsoluteHttpUrl, joinBaseUrlAndPath, normalizeBaseUrl } from './url'

describe('shared url helpers', () => {
    it('detects absolute http urls', () => {
        expect(isAbsoluteHttpUrl('https://momei.app')).toBe(true)
        expect(isAbsoluteHttpUrl('/uploads')).toBe(false)
    })

    it('normalizes base urls with a trailing slash', () => {
        expect(normalizeBaseUrl(' https://momei.app/assets ')).toBe('https://momei.app/assets/')
        expect(normalizeBaseUrl('   ')).toBeNull()
        expect(ensureTrailingSlash('/uploads')).toBe('/uploads/')
    })

    it('builds absolute urls from http bases', () => {
        expect(buildAbsoluteUrl('https://momei.app', '/posts/test-post?page=2')).toBe('https://momei.app/posts/test-post?page=2')
    })

    it('joins relative base paths without duplicating slashes', () => {
        expect(joinBaseUrlAndPath('/uploads/', 'image/test.jpg')).toBe('/uploads/image/test.jpg')
    })
})
