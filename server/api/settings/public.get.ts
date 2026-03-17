import { getSetting, getSettings } from '~/server/services/setting'
import { resolveGoogleAdSenseAccount } from '~/server/utils/ad-network-config'
import { PUBLIC_SETTING_KEYS, SettingKey } from '~/types/setting'

/**
 * 获取公开站点配置
 * GET /api/settings/public
 */
export default defineEventHandler(async () => {
    try {
        const commercialRaw = await getSetting<string>(SettingKey.COMMERCIAL_SPONSORSHIP, null)
        const settings = await getSettings([...PUBLIC_SETTING_KEYS])

        return {
            code: 200,
            data: {
                siteName: settings[SettingKey.SITE_NAME] || settings[SettingKey.SITE_TITLE],
                siteTitle: settings[SettingKey.SITE_TITLE] || settings[SettingKey.SITE_NAME],
                siteDescription: settings[SettingKey.SITE_DESCRIPTION],
                siteKeywords: settings[SettingKey.SITE_KEYWORDS],
                postCopyright: settings[SettingKey.POST_COPYRIGHT],
                siteCopyrightOwner: settings[SettingKey.SITE_COPYRIGHT_OWNER],
                siteCopyrightStartYear: settings[SettingKey.SITE_COPYRIGHT_START_YEAR],
                defaultLanguage: settings[SettingKey.DEFAULT_LANGUAGE],
                baiduAnalytics: settings[SettingKey.BAIDU_ANALYTICS],
                googleAnalytics: settings[SettingKey.GOOGLE_ANALYTICS],
                clarityAnalytics: settings[SettingKey.CLARITY_ANALYTICS],
                siteLogo: settings[SettingKey.SITE_LOGO],
                siteFavicon: settings[SettingKey.SITE_FAVICON],
                siteOperator: settings[SettingKey.SITE_OPERATOR],
                contactEmail: settings[SettingKey.CONTACT_EMAIL],
                feedbackUrl: settings[SettingKey.FEEDBACK_URL],
                googleAdsenseAccount: resolveGoogleAdSenseAccount(typeof commercialRaw === 'string' ? commercialRaw : null),
                showComplianceInfo: String(settings[SettingKey.SHOW_COMPLIANCE_INFO]) === 'true',
                icpLicenseNumber: settings[SettingKey.ICP_LICENSE_NUMBER],
                publicSecurityNumber: settings[SettingKey.PUBLIC_SECURITY_NUMBER],
                footerCode: settings[SettingKey.FOOTER_CODE],
                travellingsEnabled: String(settings[SettingKey.TRAVELLINGS_ENABLED] ?? 'true') === 'true',
                travellingsHeaderEnabled: String(settings[SettingKey.TRAVELLINGS_HEADER_ENABLED] ?? 'true') === 'true',
                travellingsFooterEnabled: String(settings[SettingKey.TRAVELLINGS_FOOTER_ENABLED] ?? 'true') === 'true',
                travellingsSidebarEnabled: String(settings[SettingKey.TRAVELLINGS_SIDEBAR_ENABLED] ?? 'true') === 'true',
                live2dEnabled: String(settings[SettingKey.LIVE2D_ENABLED]) === 'true',
                live2dScriptUrl: settings[SettingKey.LIVE2D_SCRIPT_URL] || '',
                live2dModelUrl: settings[SettingKey.LIVE2D_MODEL_URL] || '',
                live2dOptionsJson: settings[SettingKey.LIVE2D_OPTIONS_JSON] || '',
                live2dMobileEnabled: String(settings[SettingKey.LIVE2D_MOBILE_ENABLED]) === 'true',
                live2dMinWidth: Number(settings[SettingKey.LIVE2D_MIN_WIDTH] || 1024),
                live2dDataSaverBlock: settings[SettingKey.LIVE2D_DATA_SAVER_BLOCK] !== 'false',
                canvasNestEnabled: String(settings[SettingKey.CANVAS_NEST_ENABLED]) === 'true',
                canvasNestOptionsJson: settings[SettingKey.CANVAS_NEST_OPTIONS_JSON] || '',
                canvasNestMobileEnabled: String(settings[SettingKey.CANVAS_NEST_MOBILE_ENABLED]) === 'true',
                canvasNestMinWidth: Number(settings[SettingKey.CANVAS_NEST_MIN_WIDTH] || 1024),
                canvasNestDataSaverBlock: settings[SettingKey.CANVAS_NEST_DATA_SAVER_BLOCK] !== 'false',
                effectsMobileEnabled: settings[SettingKey.EFFECTS_MOBILE_ENABLED] === null || settings[SettingKey.EFFECTS_MOBILE_ENABLED] === undefined ? null : String(settings[SettingKey.EFFECTS_MOBILE_ENABLED]) === 'true',
                effectsMinWidth: settings[SettingKey.EFFECTS_MIN_WIDTH] === null || settings[SettingKey.EFFECTS_MIN_WIDTH] === undefined ? null : Number(settings[SettingKey.EFFECTS_MIN_WIDTH]),
                effectsDataSaverBlock: settings[SettingKey.EFFECTS_DATA_SAVER_BLOCK] === null || settings[SettingKey.EFFECTS_DATA_SAVER_BLOCK] === undefined ? null : settings[SettingKey.EFFECTS_DATA_SAVER_BLOCK] !== 'false',
                aiEnabled: String(settings[SettingKey.AI_ENABLED]) === 'true',
                asrEnabled: String(settings[SettingKey.ASR_ENABLED]) === 'true' || ((
                    !!process.env.ASR_API_KEY
                    || !!settings[SettingKey.VOLCENGINE_APP_ID]
                ) && settings[SettingKey.ASR_ENABLED] !== 'false'),
                ttsEnabled: String(settings[SettingKey.TTS_ENABLED]) === 'true' || (!!process.env.TTS_API_KEY && settings[SettingKey.TTS_ENABLED] !== 'false'),
                webPushEnabled: Boolean(settings[SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY]),
                webPushPublicKey: settings[SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY] || '',
            },
        }
    } catch {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch public settings',
        })
    }
})
