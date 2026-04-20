import { describe, expect, it } from 'vitest'
import { buildCanonicalPageUrl } from './use-page-seo'

describe('usePageSeo', () => {
    it('normalizes the site root canonical url without a trailing slash', () => {
        expect(buildCanonicalPageUrl('https://momei.app/', '/')).toBe('https://momei.app')
        expect(buildCanonicalPageUrl('https://momei.app', '/')).toBe('https://momei.app')
    })

    it('keeps non-root paths as absolute urls', () => {
        expect(buildCanonicalPageUrl('https://momei.app/', '/posts/test-post')).toBe('https://momei.app/posts/test-post')
        expect(buildCanonicalPageUrl('https://momei.app', '/en-US')).toBe('https://momei.app/en-US')
    })
})
