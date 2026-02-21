import { describe, it, expect } from 'vitest'
import { i18nStorage, t, loadLocaleMessages, getLocale } from './i18n'
import { toProjectLocale, DEFAULT_LOCALE } from './locale'

describe('server/utils/i18n.ts', () => {
    it('should fall back to default locale if not in store', () => {
        expect(getLocale()).toBe(toProjectLocale(DEFAULT_LOCALE))
    })

    it('should use locale from AsyncLocalStorage run', () => {
        i18nStorage.run('en-US', () => {
            expect(getLocale()).toBe('en-US')
        })
    })

    it('should load locale messages', async () => {
        const messages = await loadLocaleMessages('zh-CN')
        expect(messages).toBeDefined()
        expect(typeof messages).toBe('object')
    })

    it('should translate keys correctly in store run', async () => {
        await i18nStorage.run('zh-CN', async () => {
            const result = await t('app.name')
            expect(result).toBe('墨梅博客')
        })
    })

    it('should replace params correctly', async () => {
        await i18nStorage.run('zh-CN', async () => {
            // "notFound": "资源不存在: {{resource}}"
            const result = await t('error.notFound', { resource: 'Post' })
            expect(result).toContain('资源不存在')
            expect(result).toContain('Post')
        })
    })

    it('should support en-US translation', async () => {
        await i18nStorage.run('en-US', async () => {
            const result = await t('error.unauthorized')
            expect(result).toBe('Unauthorized, please login first')
        })
    })
})
