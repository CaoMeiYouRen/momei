import { getSettings } from '@/server/services/setting'

export default defineEventHandler(async () => {
    const themeKeys = [
        'theme_preset',
        'theme_primary_color',
        'theme_border_radius',
        'theme_logo_url',
        'theme_favicon_url',
        'theme_mourning_mode',
        'theme_background_type',
        'theme_background_value',
    ]

    const settings = await getSettings(themeKeys)

    return {
        code: 200,
        data: settings,
    }
})
