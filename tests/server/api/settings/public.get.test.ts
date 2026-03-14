import { beforeEach, describe, expect, it, vi } from 'vitest'
import publicSettingsHandler from '@/server/api/settings/public.get'
import { SettingKey } from '@/types/setting'

vi.mock('@/server/services/setting', () => ({
    getSetting: vi.fn(),
    getSettings: vi.fn(),
}))

vi.mock('@/server/utils/ad-network-config', () => ({
    resolveGoogleAdSenseAccount: vi.fn(() => 'ca-pub-1234567890123456'),
}))

import { getSetting, getSettings } from '@/server/services/setting'

describe('GET /api/settings/public', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getSetting).mockResolvedValue(null)
        vi.mocked(getSettings).mockResolvedValue({
            [SettingKey.SITE_NAME]: 'Momei',
            [SettingKey.SITE_TITLE]: 'Momei Blog',
            [SettingKey.SITE_DESCRIPTION]: 'AI-powered developer blog',
            [SettingKey.SITE_KEYWORDS]: 'ai,blog',
            [SettingKey.POST_COPYRIGHT]: 'all-rights-reserved',
            [SettingKey.SITE_COPYRIGHT_OWNER]: 'Momei Team',
            [SettingKey.SITE_COPYRIGHT_START_YEAR]: '2024',
            [SettingKey.DEFAULT_LANGUAGE]: 'zh-CN',
            [SettingKey.BAIDU_ANALYTICS]: null,
            [SettingKey.GOOGLE_ANALYTICS]: null,
            [SettingKey.CLARITY_ANALYTICS]: null,
            [SettingKey.SITE_LOGO]: '',
            [SettingKey.SITE_FAVICON]: '',
            [SettingKey.SITE_OPERATOR]: 'Momei Team',
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
        })
    })

    it('should expose footer copyright settings separately from the default post copyright license', async () => {
        const result = await publicSettingsHandler({} as any)

        expect(result.code).toBe(200)
        expect(result.data.postCopyright).toBe('all-rights-reserved')
        expect(result.data.siteCopyrightOwner).toBe('Momei Team')
        expect(result.data.siteCopyrightStartYear).toBe('2024')
        expect(result.data.siteTitle).toBe('Momei Blog')
    })
})
