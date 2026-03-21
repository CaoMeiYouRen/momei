import { describe, expect, it } from 'vitest'
import { siteConfigSchema } from './install'

function createLocalizedText(value: string) {
    return {
        version: 1 as const,
        type: 'localized-text' as const,
        locales: {
            'zh-CN': value,
        },
        legacyValue: null,
    }
}

function createLocalizedStringList(value: string[]) {
    return {
        version: 1 as const,
        type: 'localized-string-list' as const,
        locales: {
            'zh-CN': value,
        },
        legacyValue: null,
    }
}

describe('siteConfigSchema', () => {
    it('accepts all enabled app locales during installation', () => {
        expect(siteConfigSchema.safeParse({
            siteTitle: createLocalizedText('Momei'),
            siteDescription: createLocalizedText('A localized site description'),
            siteKeywords: createLocalizedStringList(['ai', 'blog']),
            siteUrl: 'https://example.com',
            defaultLanguage: 'zh-TW',
            postCopyright: 'cc-by',
            siteCopyrightOwner: createLocalizedText('Momei Team'),
            siteCopyrightStartYear: '2024',
        }).success).toBe(true)

        expect(siteConfigSchema.safeParse({
            siteTitle: createLocalizedText('Momei'),
            siteDescription: createLocalizedText('Another localized description'),
            siteKeywords: createLocalizedStringList([]),
            siteUrl: '',
            defaultLanguage: 'ko-KR',
            postCopyright: 'all-rights-reserved',
            siteCopyrightOwner: createLocalizedText(''),
            siteCopyrightStartYear: '',
        }).success).toBe(true)
    })

    it('rejects unsupported copyright values', () => {
        const result = siteConfigSchema.safeParse({
            siteTitle: createLocalizedText('Momei'),
            siteDescription: createLocalizedText('A localized site description'),
            siteKeywords: createLocalizedStringList(['ai', 'blog']),
            siteUrl: 'https://example.com',
            defaultLanguage: 'zh-CN',
            postCopyright: 'custom-copyright-text',
            siteCopyrightOwner: createLocalizedText('Momei Team'),
            siteCopyrightStartYear: '2024',
        })

        expect(result.success).toBe(false)
    })

    it('rejects invalid footer copyright start year', () => {
        const result = siteConfigSchema.safeParse({
            siteTitle: createLocalizedText('Momei'),
            siteDescription: createLocalizedText('A localized site description'),
            siteKeywords: createLocalizedStringList(['ai', 'blog']),
            siteUrl: 'https://example.com',
            defaultLanguage: 'zh-CN',
            postCopyright: 'all-rights-reserved',
            siteCopyrightOwner: createLocalizedText('Momei Team'),
            siteCopyrightStartYear: '24',
        })

        expect(result.success).toBe(false)
    })

    it('rejects empty localized site title payloads', () => {
        const result = siteConfigSchema.safeParse({
            siteTitle: createLocalizedText(''),
            siteDescription: createLocalizedText('A localized site description'),
            siteKeywords: createLocalizedStringList(['ai', 'blog']),
            siteUrl: 'https://example.com',
            defaultLanguage: 'zh-CN',
            postCopyright: 'all-rights-reserved',
            siteCopyrightOwner: createLocalizedText('Momei Team'),
            siteCopyrightStartYear: '2024',
        })

        expect(result.success).toBe(false)
    })
})
