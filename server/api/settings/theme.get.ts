import { getSettings, SETTING_ENV_MAP } from '@/server/services/setting'
import { SettingKey } from '@/types/setting'

export default defineEventHandler(async () => {
    const themeKeys = [
        SettingKey.THEME_PRESET,
        SettingKey.THEME_PRIMARY_COLOR,
        SettingKey.THEME_ACCENT_COLOR,
        SettingKey.THEME_SURFACE_COLOR,
        SettingKey.THEME_TEXT_COLOR,
        SettingKey.THEME_DARK_PRIMARY_COLOR,
        SettingKey.THEME_DARK_ACCENT_COLOR,
        SettingKey.THEME_DARK_SURFACE_COLOR,
        SettingKey.THEME_DARK_TEXT_COLOR,
        SettingKey.THEME_BORDER_RADIUS,
        SettingKey.SITE_LOGO,
        SettingKey.SITE_FAVICON,
        SettingKey.THEME_MOURNING_MODE,
        SettingKey.THEME_BACKGROUND_TYPE,
        SettingKey.THEME_BACKGROUND_VALUE,
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

    // 映射回前端需要的 camelCase 格式，以保持向后兼容
    const data: Record<string, any> = {
        themePreset: settings[SettingKey.THEME_PRESET],
        themePrimaryColor: settings[SettingKey.THEME_PRIMARY_COLOR],
        themeAccentColor: settings[SettingKey.THEME_ACCENT_COLOR],
        themeSurfaceColor: settings[SettingKey.THEME_SURFACE_COLOR],
        themeTextColor: settings[SettingKey.THEME_TEXT_COLOR],
        themeDarkPrimaryColor: settings[SettingKey.THEME_DARK_PRIMARY_COLOR],
        themeDarkAccentColor: settings[SettingKey.THEME_DARK_ACCENT_COLOR],
        themeDarkSurfaceColor: settings[SettingKey.THEME_DARK_SURFACE_COLOR],
        themeDarkTextColor: settings[SettingKey.THEME_DARK_TEXT_COLOR],
        themeBorderRadius: settings[SettingKey.THEME_BORDER_RADIUS],
        themeLogoUrl: settings[SettingKey.SITE_LOGO],
        themeFaviconUrl: settings[SettingKey.SITE_FAVICON],
        themeMourningMode: settings[SettingKey.THEME_MOURNING_MODE],
        themeBackgroundType: settings[SettingKey.THEME_BACKGROUND_TYPE],
        themeBackgroundValue: settings[SettingKey.THEME_BACKGROUND_VALUE],
    }

    return {
        code: 200,
        data,
        meta,
    }
})
