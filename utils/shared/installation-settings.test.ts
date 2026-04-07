import { describe, expect, it } from 'vitest'
import {
    coerceInstallationLocalizedSiteFieldValue,
    mergeInstallationLocalizedSiteFieldValue,
    resolveInstallationLocalizedSiteFieldInputValue,
    updateInstallationLocalizedSiteFieldValue,
} from './installation-settings'

describe('installation-settings localized helpers', () => {
    it('should parse structured localized env values and resolve by locale fallback', () => {
        const value = coerceInstallationLocalizedSiteFieldValue('siteTitle', JSON.stringify({
            version: 1,
            type: 'localized-text',
            locales: {
                'zh-CN': '墨梅博客',
                'en-US': 'Momei Blog',
            },
            legacyValue: '旧标题',
        }))

        expect(resolveInstallationLocalizedSiteFieldInputValue('siteTitle', value, 'en-US')).toBe('Momei Blog')
        expect(resolveInstallationLocalizedSiteFieldInputValue('siteTitle', value, 'ja-JP')).toBe('Momei Blog')
    })

    it('should update only the active locale draft for localized text and list fields', () => {
        const nextTitle = updateInstallationLocalizedSiteFieldValue('siteTitle', {
            version: 1,
            type: 'localized-text',
            locales: {
                'zh-CN': '墨梅博客',
            },
            legacyValue: '旧标题',
        }, 'en-US', 'Momei Blog')

        const nextKeywords = updateInstallationLocalizedSiteFieldValue('siteKeywords', {
            version: 1,
            type: 'localized-string-list',
            locales: {
                'zh-CN': ['AI', '博客'],
            },
            legacyValue: ['旧关键词'],
        }, 'en-US', 'AI, Blog')

        expect(nextTitle).toEqual({
            version: 1,
            type: 'localized-text',
            locales: {
                'zh-CN': '墨梅博客',
                'en-US': 'Momei Blog',
            },
            legacyValue: '旧标题',
        })

        expect(nextKeywords).toEqual({
            version: 1,
            type: 'localized-string-list',
            locales: {
                'zh-CN': ['AI', '博客'],
                'en-US': ['AI', 'Blog'],
            },
            legacyValue: ['旧关键词'],
        })
    })

    it('should remove only the active locale when localized input is cleared', () => {
        const nextTitle = updateInstallationLocalizedSiteFieldValue('siteTitle', {
            version: 1,
            type: 'localized-text',
            locales: {
                'zh-CN': '墨梅博客',
                'en-US': 'Momei Blog',
            },
            legacyValue: '旧标题',
        }, 'en-US', '   ')

        const nextKeywords = updateInstallationLocalizedSiteFieldValue('siteKeywords', {
            version: 1,
            type: 'localized-string-list',
            locales: {
                'zh-CN': ['AI', '博客'],
                'en-US': ['AI', 'Blog'],
            },
            legacyValue: ['旧关键词'],
        }, 'en-US', '   ')

        expect(nextTitle).toEqual({
            version: 1,
            type: 'localized-text',
            locales: {
                'zh-CN': '墨梅博客',
            },
            legacyValue: '旧标题',
        })

        expect(nextKeywords).toEqual({
            version: 1,
            type: 'localized-string-list',
            locales: {
                'zh-CN': ['AI', '博客'],
            },
            legacyValue: ['旧关键词'],
        })
    })

    it('should merge installation payloads with existing localized settings without dropping previous locales', () => {
        const merged = mergeInstallationLocalizedSiteFieldValue('siteCopyrightOwner', {
            version: 1,
            type: 'localized-text',
            locales: {
                'zh-CN': '墨梅团队',
            },
            legacyValue: '旧版权方',
        }, {
            version: 1,
            type: 'localized-text',
            locales: {
                'en-US': 'Momei Team',
            },
            legacyValue: null,
        })

        expect(merged).toEqual({
            version: 1,
            type: 'localized-text',
            locales: {
                'zh-CN': '墨梅团队',
                'en-US': 'Momei Team',
            },
            legacyValue: '旧版权方',
        })
    })
})
