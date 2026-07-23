import { describe, expect, it } from 'vitest'
import { normalizeAsciiSlug } from './slug'

describe('normalizeAsciiSlug', () => {
    it('normalizes a plain ascii slug', () => {
        expect(normalizeAsciiSlug('  Hello World  ')).toBe('hello-world')
    })

    it('supports stripping quotes for canonical aliases', () => {
        expect(normalizeAsciiSlug(' "Quoted" Title ', { stripQuotes: true })).toBe('quoted-title')
    })

    it('preserves slashes and underscores when requested', () => {
        expect(normalizeAsciiSlug(' Guides/Hello_World ', { allowSlash: true, allowUnderscore: true })).toBe('guides/hello_world')
    })

    it('preserves slashes without underscores', () => {
        expect(normalizeAsciiSlug(' Guides/Hello_World ', { allowSlash: true })).toBe('guides/hello-world')
    })

    it('preserves underscores without slashes', () => {
        // allowUnderscore only: slash is replaced with '-', underscore preserved
        expect(normalizeAsciiSlug(' Guides/Hello_World ', { allowUnderscore: true })).toBe('guides-hello_world')
    })
})
