import { getSettings, SETTING_ENV_MAP } from '@/server/services/setting'

export default defineEventHandler(async () => {
    const themeKeys = [
        'themePreset',
        'themePrimaryColor',
        'themeAccentColor',
        'themeSurfaceColor',
        'themeTextColor',
        'themeDarkPrimaryColor',
        'themeDarkAccentColor',
        'themeDarkSurfaceColor',
        'themeDarkTextColor',
        'themeBorderRadius',
        'themeLogoUrl',
        'themeFaviconUrl',
        'themeMourningMode',
        'themeBackgroundType',
        'themeBackgroundValue',
    ]

    const settings = await getSettings(themeKeys)

    // 检查哪些配置项受环境变量锁定
    const meta: Record<string, { isLocked: boolean }> = {}
    themeKeys.forEach((key) => {
        const envKey = SETTING_ENV_MAP[key]
        meta[key] = {
            isLocked: !!(envKey && process.env[envKey] !== undefined),
        }
    })

    return {
        code: 200,
        data: settings,
        meta,
    }
})
