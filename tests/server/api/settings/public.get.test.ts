import { beforeEach, describe, expect, it, vi } from 'vitest'
import publicSettingsHandler from '@/server/api/settings/public.get'
import { clearRuntimeCache } from '@/server/utils/runtime-cache'
import { SettingKey } from '@/types/setting'

const { ensureDatabaseReady } = vi.hoisted(() => ({
    ensureDatabaseReady: vi.fn().mockResolvedValue(true),
}))

vi.mock('~/server/services/setting', () => ({
    getSettings: vi.fn(),
    resolveLocalizedSettingsFromValues: vi.fn(),
}))

vi.mock('@/server/database', () => ({
    ensureDatabaseReady,
}))

vi.mock('~/server/utils/locale', () => ({
    detectRequestAuthLocale: vi.fn(() => 'zh-Hans'),
    mapAuthLocaleToAppLocale: vi.fn(() => 'zh-CN'),
}))

vi.mock('~/server/utils/ad-network-config', () => ({
    resolveGoogleAdSenseAccount: vi.fn(() => 'ca-pub-1234567890123456'),
}))

import { getSettings, resolveLocalizedSettingsFromValues } from '~/server/services/setting'

describe('GET /api/settings/public', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        clearRuntimeCache()
        ensureDatabaseReady.mockResolvedValue(true)
        vi.mocked(getSettings).mockResolvedValue({
            [SettingKey.SITE_NAME]: 'Momei',
            [SettingKey.SITE_TITLE]: null,
            [SettingKey.SITE_DESCRIPTION]: null,
            [SettingKey.SITE_KEYWORDS]: null,
            [SettingKey.POST_COPYRIGHT]: 'all-rights-reserved',
            [SettingKey.SITE_COPYRIGHT_OWNER]: null,
            [SettingKey.SITE_COPYRIGHT_START_YEAR]: '2024',
            [SettingKey.DEFAULT_LANGUAGE]: 'zh-CN',
            [SettingKey.BAIDU_ANALYTICS]: null,
            [SettingKey.GOOGLE_ANALYTICS]: null,
            [SettingKey.CLARITY_ANALYTICS]: null,
            [SettingKey.SITE_LOGO]: '',
            [SettingKey.SITE_FAVICON]: '',
            [SettingKey.SITE_OPERATOR]: null,
            [SettingKey.CONTACT_EMAIL]: 'admin@example.com',
            [SettingKey.FEEDBACK_URL]: '',
            [SettingKey.SHOW_COMPLIANCE_INFO]: 'false',
            [SettingKey.ICP_LICENSE_NUMBER]: '',
            [SettingKey.PUBLIC_SECURITY_NUMBER]: '',
            [SettingKey.FOOTER_CODE]: '',
            [SettingKey.TRAVELLINGS_ENABLED]: 'true',
            [SettingKey.TRAVELLINGS_HEADER_ENABLED]: 'true',
            [SettingKey.TRAVELLINGS_FOOTER_ENABLED]: 'true',
            [SettingKey.TRAVELLINGS_SIDEBAR_ENABLED]: 'true',
            [SettingKey.LIVE2D_ENABLED]: 'false',
            [SettingKey.LIVE2D_SCRIPT_URL]: '',
            [SettingKey.LIVE2D_MODEL_URL]: '',
            [SettingKey.LIVE2D_OPTIONS_JSON]: '',
            [SettingKey.LIVE2D_MOBILE_ENABLED]: 'false',
            [SettingKey.LIVE2D_MIN_WIDTH]: '1024',
            [SettingKey.LIVE2D_DATA_SAVER_BLOCK]: 'true',
            [SettingKey.CANVAS_NEST_ENABLED]: 'false',
            [SettingKey.CANVAS_NEST_OPTIONS_JSON]: '',
            [SettingKey.CANVAS_NEST_MOBILE_ENABLED]: 'false',
            [SettingKey.CANVAS_NEST_MIN_WIDTH]: '1024',
            [SettingKey.CANVAS_NEST_DATA_SAVER_BLOCK]: 'true',
            [SettingKey.EFFECTS_MOBILE_ENABLED]: null,
            [SettingKey.EFFECTS_MIN_WIDTH]: null,
            [SettingKey.EFFECTS_DATA_SAVER_BLOCK]: null,
            [SettingKey.AI_ENABLED]: 'false',
            [SettingKey.ASR_ENABLED]: 'false',
            [SettingKey.TTS_ENABLED]: 'false',
            [SettingKey.VOLCENGINE_APP_ID]: null,
            [SettingKey.VOLCENGINE_ACCESS_KEY]: null,
            [SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY]: '',
            [SettingKey.COMMERCIAL_SPONSORSHIP]: null,
        })
        vi.mocked(resolveLocalizedSettingsFromValues).mockReturnValue({
            [SettingKey.SITE_TITLE]: {
                key: SettingKey.SITE_TITLE,
                value: '墨梅博客',
                requestedLocale: 'zh-CN',
                resolvedLocale: 'zh-CN',
                fallbackChain: ['zh-CN'],
                usedFallback: false,
                usedLegacyValue: false,
            },
            [SettingKey.SITE_DESCRIPTION]: {
                key: SettingKey.SITE_DESCRIPTION,
                value: 'AI 驱动开发者博客',
                requestedLocale: 'zh-CN',
                resolvedLocale: 'zh-CN',
                fallbackChain: ['zh-CN'],
                usedFallback: false,
                usedLegacyValue: false,
            },
            [SettingKey.SITE_KEYWORDS]: {
                key: SettingKey.SITE_KEYWORDS,
                value: ['AI', '博客'],
                requestedLocale: 'zh-CN',
                resolvedLocale: 'zh-CN',
                fallbackChain: ['zh-CN'],
                usedFallback: false,
                usedLegacyValue: false,
            },
            [SettingKey.SITE_OPERATOR]: {
                key: SettingKey.SITE_OPERATOR,
                value: '墨梅团队',
                requestedLocale: 'zh-CN',
                resolvedLocale: 'zh-CN',
                fallbackChain: ['zh-CN'],
                usedFallback: false,
                usedLegacyValue: false,
            },
            [SettingKey.SITE_COPYRIGHT_OWNER]: {
                key: SettingKey.SITE_COPYRIGHT_OWNER,
                value: null,
                requestedLocale: 'zh-CN',
                resolvedLocale: null,
                fallbackChain: ['zh-CN'],
                usedFallback: false,
                usedLegacyValue: false,
            },
        })
    })

    it('should expose footer copyright settings separately from the default post copyright license', async () => {
        const result = await publicSettingsHandler({} as any)

        expect(result.code).toBe(200)
        expect(ensureDatabaseReady).toHaveBeenCalledTimes(1)
        expect(getSettings).toHaveBeenCalledTimes(1)
        expect(resolveLocalizedSettingsFromValues).toHaveBeenCalledTimes(1)
        expect(result.data.postCopyright).toBe('all-rights-reserved')
        expect(result.data.siteCopyrightOwner).toBe('墨梅团队')
        expect(result.data.siteCopyrightStartYear).toBe('2024')
        expect(result.data.siteTitle).toBe('墨梅博客')
        expect(result.data.siteDescription).toBe('AI 驱动开发者博客')
        expect(result.data.siteKeywords).toBe('AI, 博客')
        expect(result.data.i18n).toEqual({
            locale: 'zh-CN',
            fallbackChain: ['zh-CN'],
            resolvedLocales: {
                siteTitle: 'zh-CN',
                siteDescription: 'zh-CN',
                siteKeywords: 'zh-CN',
                siteOperator: 'zh-CN',
                siteCopyrightOwner: 'zh-CN',
            },
        })
    })

    it('should reuse short ttl cache for repeated locale requests', async () => {
        const first = await publicSettingsHandler({} as any)
        const second = await publicSettingsHandler({} as any)

        expect(first).toEqual(second)
        expect(ensureDatabaseReady).toHaveBeenCalledTimes(1)
        expect(getSettings).toHaveBeenCalledTimes(1)
        expect(resolveLocalizedSettingsFromValues).toHaveBeenCalledTimes(1)
    })

    it('should not cache fallback settings when database bootstrap fails', async () => {
        ensureDatabaseReady.mockResolvedValueOnce(false)

        await expect(publicSettingsHandler({} as any)).rejects.toMatchObject({
            statusCode: 503,
        })
        expect(getSettings).not.toHaveBeenCalled()
    })
})
