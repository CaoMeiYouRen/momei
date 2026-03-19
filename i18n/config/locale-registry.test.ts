import { describe, expect, it } from 'vitest'
import {
    APP_DEFAULT_LOCALE,
    APP_LOCALE_CODES,
    getCreativeCommonsDeedSuffix,
    getLocaleRegistryItem,
    getLocaleRoutePrefix,
    isAppLocale,
    isSeoReadyLocale,
    NUXT_I18N_LOCALES,
    resolveAppLocaleCode,
} from './locale-registry'
import { getNuxtLocaleMessageFilePaths } from './locale-modules'

describe('i18n locale registry', () => {
    it('should expose enabled app locales', () => {
        expect(APP_LOCALE_CODES).toEqual(['zh-CN', 'zh-TW', 'en-US', 'ko-KR', 'ja-JP'])
        expect(NUXT_I18N_LOCALES).toHaveLength(5)
    })

    it('should resolve aliases to app locales', () => {
        expect(resolveAppLocaleCode('zh-Hans')).toBe('zh-CN')
        expect(resolveAppLocaleCode('en')).toBe('en-US')
        expect(resolveAppLocaleCode('zh-Hant')).toBe('zh-TW')
        expect(resolveAppLocaleCode('ko')).toBe('ko-KR')
        expect(resolveAppLocaleCode('ja')).toBe('ja-JP')
        expect(resolveAppLocaleCode('fr-FR')).toBe(APP_DEFAULT_LOCALE)
    })

    it('should expose route prefixes from registry', () => {
        expect(getLocaleRoutePrefix('zh-CN')).toBe('')
        expect(getLocaleRoutePrefix('en-US')).toBe('/en-US')
        expect(getLocaleRoutePrefix('zh-TW')).toBe('/zh-TW')
        expect(getLocaleRoutePrefix('ko-KR')).toBe('/ko-KR')
        expect(getLocaleRoutePrefix('ja-JP')).toBe('/ja-JP')
    })

    it('should report seo ready locales', () => {
        expect(isSeoReadyLocale('zh-CN')).toBe(true)
        expect(isSeoReadyLocale('en-US')).toBe(true)
        expect(isSeoReadyLocale('zh-TW')).toBe(false)
        expect(isSeoReadyLocale('ko-KR')).toBe(false)
        expect(isSeoReadyLocale('ja-JP')).toBe(false)
        expect(isSeoReadyLocale('fr-FR')).toBe(false)
    })

    it('should expose locale metadata', () => {
        expect(isAppLocale('zh-CN')).toBe(true)
        expect(getLocaleRegistryItem('en-US').ogLocale).toBe('en_US')
        expect(getLocaleRegistryItem('zh-TW').nativeName).toBe('繁體中文')
        expect(getLocaleRegistryItem('ko-KR').nativeName).toBe('한국어')
        expect(getLocaleRegistryItem('ja-JP').nativeName).toBe('日本語')
    })

    it('should expose Creative Commons deed suffixes from locale registry', () => {
        expect(getCreativeCommonsDeedSuffix('zh-CN')).toBe('deed.zh-hans')
        expect(getCreativeCommonsDeedSuffix('zh-TW')).toBe('deed.zh-hant')
        expect(getCreativeCommonsDeedSuffix('en-US')).toBe('deed.en')
        expect(getCreativeCommonsDeedSuffix('ko-KR')).toBe('deed.ko')
        expect(getCreativeCommonsDeedSuffix('ja-JP')).toBe('deed.ja')
        expect(getCreativeCommonsDeedSuffix('fr-FR')).toBe('deed.zh-hans')
    })

    it('should build module file paths for enabled locales', () => {
        expect(getNuxtLocaleMessageFilePaths('zh-CN')).toEqual([
            'zh-CN/common.json',
            'zh-CN/components.json',
            'zh-CN/public.json',
            'zh-CN/settings.json',
            'zh-CN/legal.json',
            'zh-CN/auth.json',
        ])
    })
})
