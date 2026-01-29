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
            },
        }
    } catch {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch public settings',
        })
    }
})
