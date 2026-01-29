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
            },
        }
    } catch {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch public settings',
        })
    }
})
