import { setSettings } from '@/server/services/setting'
import { requireAdmin } from '@/server/utils/permission'
import { SettingKey } from '@/types/setting'
import { themeUpdateSchema } from '@/utils/schemas/settings'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const body = await readValidatedBody(event, (b) => themeUpdateSchema.parse(b))

    // 将前端的 camelCase 映射为后端的 snake_case (SettingKey)
    const keyMap: Record<string, SettingKey> = {
        themePreset: SettingKey.THEME_PRESET,
        themePrimaryColor: SettingKey.THEME_PRIMARY_COLOR,
        themeAccentColor: SettingKey.THEME_ACCENT_COLOR,
        themeSurfaceColor: SettingKey.THEME_SURFACE_COLOR,
        themeTextColor: SettingKey.THEME_TEXT_COLOR,
        themeDarkPrimaryColor: SettingKey.THEME_DARK_PRIMARY_COLOR,
        themeDarkAccentColor: SettingKey.THEME_DARK_ACCENT_COLOR,
        themeDarkSurfaceColor: SettingKey.THEME_DARK_SURFACE_COLOR,
        themeDarkTextColor: SettingKey.THEME_DARK_TEXT_COLOR,
        themeBorderRadius: SettingKey.THEME_BORDER_RADIUS,
        themeLogoUrl: SettingKey.SITE_LOGO,
        themeFaviconUrl: SettingKey.SITE_FAVICON,
        themeMourningMode: SettingKey.THEME_MOURNING_MODE,
        themeBackgroundType: SettingKey.THEME_BACKGROUND_TYPE,
        themeBackgroundValue: SettingKey.THEME_BACKGROUND_VALUE,
    }

    const settingsToSave: Record<string, string | null> = {}
    for (const [key, value] of Object.entries(body)) {
        if (value === undefined) {
            continue
        }

        const dbKey = keyMap[key] || key
        if (value === null) {
            settingsToSave[dbKey] = null
        } else {
            settingsToSave[dbKey] = typeof value === 'string' ? value : JSON.stringify(value)
        }
    }

    await setSettings(settingsToSave)

    return {
        code: 200,
        message: 'Theme settings updated',
    }
})

