import { getSettings } from '~/server/services/setting'

/**
 * 获取公开站点配置
 * GET /api/settings/public
 */
export default defineEventHandler(async () => {
    try {
        const publicKeys = [
            'site_title',
            'site_description',
            'site_keywords',
            'site_copyright',
            'default_language',
            'baidu_analytics',
            'google_analytics',
            'clarity_analytics',
        ]

        const settings = await getSettings(publicKeys)

        return {
            code: 200,
            data: {
                siteTitle: settings.site_title,
                siteDescription: settings.site_description,
                siteKeywords: settings.site_keywords,
                siteCopyright: settings.site_copyright,
                defaultLanguage: settings.default_language,
                baiduAnalytics: settings.baidu_analytics,
                googleAnalytics: settings.google_analytics,
                clarityAnalytics: settings.clarity_analytics,
            },
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch public settings',
        })
    }
})
