import { describe, expect, it } from 'vitest'
import { siteConfigSchema } from './install'

describe('siteConfigSchema', () => {
    it('accepts all enabled app locales during installation', () => {
        expect(siteConfigSchema.safeParse({
            siteTitle: 'Momei',
            defaultLanguage: 'zh-TW',
            postCopyright: 'cc-by',
            siteCopyrightOwner: 'Momei Team',
            siteCopyrightStartYear: '2024',
        }).success).toBe(true)

        expect(siteConfigSchema.safeParse({
            siteTitle: 'Momei',
            defaultLanguage: 'ko-KR',
            postCopyright: 'all-rights-reserved',
            siteCopyrightOwner: '',
            siteCopyrightStartYear: '',
        }).success).toBe(true)
    })

    it('rejects unsupported copyright values', () => {
        const result = siteConfigSchema.safeParse({
            siteTitle: 'Momei',
            defaultLanguage: 'zh-CN',
            postCopyright: 'custom-copyright-text',
            siteCopyrightOwner: 'Momei Team',
            siteCopyrightStartYear: '2024',
        })

        expect(result.success).toBe(false)
    })

    it('rejects invalid footer copyright start year', () => {
        const result = siteConfigSchema.safeParse({
            siteTitle: 'Momei',
            defaultLanguage: 'zh-CN',
            postCopyright: 'all-rights-reserved',
            siteCopyrightOwner: 'Momei Team',
            siteCopyrightStartYear: '24',
        })

        expect(result.success).toBe(false)
    })
})
