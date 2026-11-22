import { describe, expect, it } from 'vitest'
import { SettingKey } from '@/types/setting'
import { resolvePublicLocalizedSettingsFromValues } from '@/server/services/public-settings'

/**
 * 公开本地化设置解析：locale 命中优先，其次回退到 legacy 单值。
 * 这里直接喂 values，避免依赖环境变量与数据库。
 */
describe('resolvePublicLocalizedSettingsFromValues', () => {
    it('优先返回请求语言的值', () => {
        const resolved = resolvePublicLocalizedSettingsFromValues({
            [SettingKey.SITE_TITLE]: {
                version: 1,
                type: 'localized-text',
                locales: { 'zh-CN': '墨梅' },
                legacyValue: '旧标题',
            },
        }, [SettingKey.SITE_TITLE], 'zh-CN')

        expect(resolved[SettingKey.SITE_TITLE]).toMatchObject({
            resolvedLocale: 'zh-CN',
            usedFallback: false,
            usedLegacyValue: false,
            value: '墨梅',
        })
    })

    it('缺少 locale 值但 legacy 有内容时回退到 legacy', () => {
        const resolved = resolvePublicLocalizedSettingsFromValues({
            [SettingKey.SITE_TITLE]: {
                version: 1,
                type: 'localized-text',
                locales: {},
                legacyValue: '旧标题',
            },
        }, [SettingKey.SITE_TITLE], 'zh-CN')

        expect(resolved[SettingKey.SITE_TITLE]).toMatchObject({
            resolvedLocale: 'legacy',
            usedFallback: true,
            usedLegacyValue: true,
            value: '旧标题',
        })
    })

    it('legacy 为 null 或空白时不回退', () => {
        const nullLegacy = resolvePublicLocalizedSettingsFromValues({
            [SettingKey.SITE_TITLE]: {
                version: 1,
                type: 'localized-text',
                locales: {},
                legacyValue: null,
            },
        }, [SettingKey.SITE_TITLE], 'zh-CN')
        const blankLegacy = resolvePublicLocalizedSettingsFromValues({
            [SettingKey.SITE_TITLE]: {
                version: 1,
                type: 'localized-text',
                locales: {},
                legacyValue: '   ',
            },
        }, [SettingKey.SITE_TITLE], 'zh-CN')

        expect(nullLegacy[SettingKey.SITE_TITLE]?.usedLegacyValue).toBe(false)
        expect(blankLegacy[SettingKey.SITE_TITLE]?.usedLegacyValue).toBe(false)
    })

    it('缺失记录与非法值时返回空解析结果', () => {
        const resolved = resolvePublicLocalizedSettingsFromValues({}, [SettingKey.SITE_TITLE], 'zh-CN')

        expect(resolved[SettingKey.SITE_TITLE]).toMatchObject({
            key: SettingKey.SITE_TITLE,
            usedLegacyValue: false,
        })
        expect(resolved[SettingKey.SITE_TITLE]?.value).toBeNull()
    })
})
