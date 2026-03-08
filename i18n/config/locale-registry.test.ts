import { describe, expect, it } from 'vitest'
import {
    APP_DEFAULT_LOCALE,
    APP_LOCALE_CODES,
    getLocaleRegistryItem,
    getLocaleRoutePrefix,
    isAppLocale,
    isSeoReadyLocale,
    NUXT_I18N_LOCALES,
    resolveAppLocaleCode,
} from './locale-registry'
import { getLocaleMessageFilePaths } from './locale-modules'

describe('i18n locale registry', () => {
    it('should expose enabled app locales', () => {
        expect(APP_LOCALE_CODES).toEqual(['zh-CN', 'en-US'])
        expect(NUXT_I18N_LOCALES).toHaveLength(2)
    })

    it('should resolve aliases to app locales', () => {
        expect(resolveAppLocaleCode('zh-Hans')).toBe('zh-CN')
        expect(resolveAppLocaleCode('en')).toBe('en-US')
        expect(resolveAppLocaleCode('fr-FR')).toBe(APP_DEFAULT_LOCALE)
    })

    it('should expose route prefixes from registry', () => {
        expect(getLocaleRoutePrefix('zh-CN')).toBe('')
        expect(getLocaleRoutePrefix('en-US')).toBe('/en-US')
    })

    it('should report seo ready locales', () => {
        expect(isSeoReadyLocale('zh-CN')).toBe(true)
        expect(isSeoReadyLocale('en-US')).toBe(true)
    })

    it('should expose locale metadata', () => {
        expect(isAppLocale('zh-CN')).toBe(true)
        expect(getLocaleRegistryItem('en-US').ogLocale).toBe('en_US')
    })

    it('should build module file paths for enabled locales', () => {
        expect(getLocaleMessageFilePaths('zh-CN')).toEqual([
            'zh-CN/common.json',
            'zh-CN/components.json',
            'zh-CN/pages.json',
            'zh-CN/feed.json',
        ])
    })
})
