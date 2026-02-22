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
