import { getSettings } from '~/server/services/setting'
import { SettingKey } from '~/types/setting'

/**
 * 获取公开站点配置
 * GET /api/settings/public
 */
export default defineEventHandler(async () => {
    try {
        const publicKeys = [
            SettingKey.SITE_TITLE,
            SettingKey.SITE_DESCRIPTION,
            SettingKey.SITE_KEYWORDS,
            SettingKey.SITE_COPYRIGHT,
            SettingKey.DEFAULT_LANGUAGE,
            SettingKey.BAIDU_ANALYTICS,
            SettingKey.GOOGLE_ANALYTICS,
            SettingKey.CLARITY_ANALYTICS,
            SettingKey.SITE_LOGO,
            SettingKey.SITE_FAVICON,
            SettingKey.SITE_OPERATOR,
            SettingKey.CONTACT_EMAIL,
            SettingKey.SHOW_COMPLIANCE_INFO,
            SettingKey.ICP_LICENSE_NUMBER,
            SettingKey.PUBLIC_SECURITY_NUMBER,
            SettingKey.FOOTER_CODE,
            SettingKey.LIVE2D_ENABLED,
            SettingKey.LIVE2D_SCRIPT_URL,
            SettingKey.LIVE2D_MODEL_URL,
            SettingKey.LIVE2D_OPTIONS_JSON,
            SettingKey.LIVE2D_MOBILE_ENABLED,
            SettingKey.LIVE2D_MIN_WIDTH,
            SettingKey.LIVE2D_DATA_SAVER_BLOCK,
            SettingKey.CANVAS_NEST_ENABLED,
            SettingKey.CANVAS_NEST_OPTIONS_JSON,
            SettingKey.CANVAS_NEST_MOBILE_ENABLED,
            SettingKey.CANVAS_NEST_MIN_WIDTH,
            SettingKey.CANVAS_NEST_DATA_SAVER_BLOCK,
            SettingKey.EFFECTS_MOBILE_ENABLED,
            SettingKey.EFFECTS_MIN_WIDTH,
            SettingKey.EFFECTS_DATA_SAVER_BLOCK,
            SettingKey.AI_ENABLED,
            SettingKey.ASR_ENABLED,
            SettingKey.TTS_ENABLED,
            SettingKey.ASR_VOLCENGINE_APP_ID,
            SettingKey.ASR_VOLCENGINE_ACCESS_KEY,
            SettingKey.VOLCENGINE_APP_ID,
            SettingKey.VOLCENGINE_ACCESS_KEY,
        ]

        const settings = await getSettings(publicKeys)

        return {
            code: 200,
            data: {
                siteTitle: settings[SettingKey.SITE_TITLE],
                siteDescription: settings[SettingKey.SITE_DESCRIPTION],
                siteKeywords: settings[SettingKey.SITE_KEYWORDS],
                siteCopyright: settings[SettingKey.SITE_COPYRIGHT],
                defaultLanguage: settings[SettingKey.DEFAULT_LANGUAGE],
                baiduAnalytics: settings[SettingKey.BAIDU_ANALYTICS],
                googleAnalytics: settings[SettingKey.GOOGLE_ANALYTICS],
                clarityAnalytics: settings[SettingKey.CLARITY_ANALYTICS],
                siteLogo: settings[SettingKey.SITE_LOGO],
                siteFavicon: settings[SettingKey.SITE_FAVICON],
                siteOperator: settings[SettingKey.SITE_OPERATOR],
                contactEmail: settings[SettingKey.CONTACT_EMAIL],
                showComplianceInfo: String(settings[SettingKey.SHOW_COMPLIANCE_INFO]) === 'true',
                icpLicenseNumber: settings[SettingKey.ICP_LICENSE_NUMBER],
                publicSecurityNumber: settings[SettingKey.PUBLIC_SECURITY_NUMBER],
                footerCode: settings[SettingKey.FOOTER_CODE],
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
                    || !!settings[SettingKey.ASR_VOLCENGINE_APP_ID]
                    || !!settings[SettingKey.VOLCENGINE_APP_ID]
                ) && settings[SettingKey.ASR_ENABLED] !== 'false'),
                ttsEnabled: String(settings[SettingKey.TTS_ENABLED]) === 'true' || (!!process.env.TTS_API_KEY && settings[SettingKey.TTS_ENABLED] !== 'false'),
            },
        }
    } catch {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch public settings',
        })
    }
})
