import { describe, expect, it } from 'vitest'
import { siteConfigSchema } from './install'

describe('siteConfigSchema', () => {
    it('accepts all enabled app locales during installation', () => {
        expect(siteConfigSchema.safeParse({
            siteTitle: 'Momei',
            defaultLanguage: 'zh-TW',
            siteCopyright: 'cc-by',
            footerCopyrightOwner: 'Momei Team',
            footerCopyrightStartYear: '2024',
        }).success).toBe(true)

        expect(siteConfigSchema.safeParse({
            siteTitle: 'Momei',
            defaultLanguage: 'ko-KR',
            siteCopyright: 'all-rights-reserved',
            footerCopyrightOwner: '',
            footerCopyrightStartYear: '',
        }).success).toBe(true)
    })

    it('rejects unsupported copyright values', () => {
        const result = siteConfigSchema.safeParse({
            siteTitle: 'Momei',
            defaultLanguage: 'zh-CN',
            siteCopyright: 'custom-copyright-text',
            footerCopyrightOwner: 'Momei Team',
            footerCopyrightStartYear: '2024',
        })

        expect(result.success).toBe(false)
    })

    it('rejects invalid footer copyright start year', () => {
        const result = siteConfigSchema.safeParse({
            siteTitle: 'Momei',
            defaultLanguage: 'zh-CN',
            siteCopyright: 'all-rights-reserved',
            footerCopyrightOwner: 'Momei Team',
            footerCopyrightStartYear: '24',
        })

        expect(result.success).toBe(false)
    })
})
