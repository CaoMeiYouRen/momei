import { describe, expect, it } from 'vitest'
import { siteConfigSchema } from './install'

describe('siteConfigSchema', () => {
    it('accepts all enabled app locales during installation', () => {
        expect(siteConfigSchema.safeParse({
            siteTitle: 'Momei',
            defaultLanguage: 'zh-TW',
            siteCopyright: 'cc-by',
        }).success).toBe(true)

        expect(siteConfigSchema.safeParse({
            siteTitle: 'Momei',
            defaultLanguage: 'ko-KR',
            siteCopyright: 'all-rights-reserved',
        }).success).toBe(true)
    })

    it('rejects unsupported copyright values', () => {
        const result = siteConfigSchema.safeParse({
            siteTitle: 'Momei',
            defaultLanguage: 'zh-CN',
            siteCopyright: 'custom-copyright-text',
        })

        expect(result.success).toBe(false)
    })
})
