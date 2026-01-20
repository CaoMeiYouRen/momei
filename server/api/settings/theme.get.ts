import { getSettings } from '@/server/services/setting'

export default defineEventHandler(async () => {
    const themeKeys = [
        'themePreset',
        'themePrimaryColor',
        'themeAccentColor',
        'themeBorderRadius',
        'themeLogoUrl',
        'themeFaviconUrl',
        'themeMourningMode',
        'themeBackgroundType',
        'themeBackgroundValue',
    ]

    const settings = await getSettings(themeKeys)

    return {
        code: 200,
        data: settings,
    }
})
