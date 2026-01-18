import { useAppFetch } from './use-app-fetch'

export interface ThemeSettings {
    theme_preset: string | null
    theme_primary_color: string | null
    theme_border_radius: string | null
    theme_logo_url: string | null
    theme_favicon_url: string | null
    theme_mourning_mode: boolean | string | null
    theme_background_type: 'none' | 'color' | 'image' | string | null
    theme_background_value: string | null
}

export const useTheme = () => {
    const settings = useState<ThemeSettings | null>('theme-settings', () => ({
        theme_preset: 'default',
        theme_primary_color: null,
        theme_border_radius: null,
        theme_logo_url: null,
        theme_favicon_url: null,
        theme_mourning_mode: false,
        theme_background_type: 'none',
        theme_background_value: null,
    }))

    const fetchTheme = async () => {
        const { data } = await useAppFetch<{ data: ThemeSettings }>('/api/settings/theme')
        if (data.value) {
            settings.value = { ...settings.value, ...data.value.data }
        }
    }

    const mourningMode = computed(() => {
        const val = settings.value?.theme_mourning_mode
        return val === true || val === 'true'
    })

    const customStyles = computed(() => {
        if (!settings.value) {
            return ''
        }

        const {
            theme_primary_color,
            theme_border_radius,
            theme_background_type,
            theme_background_value,
        } = settings.value

        let styles = ''

        // 主色调定制
        if (theme_primary_color) {
            styles += `
:root {
    --p-primary-500: ${theme_primary_color};
    --p-primary-color: ${theme_primary_color};
}
`
        }

        // 圆角定制
        if (theme_border_radius) {
            styles += `
:root {
    --p-content-border-radius: ${theme_border_radius};
}
`
        }

        // 背景定制
        if (theme_background_type === 'color' && theme_background_value) {
            styles += `
body {
    background-color: ${theme_background_value} !important;
}
`
        } else if (theme_background_type === 'image' && theme_background_value) {
            styles += `
body {
    background-image: url('${theme_background_value}') !important;
    background-size: cover;
    background-attachment: fixed;
}
`
        }

        // 哀悼模式
        if (mourningMode.value) {
            styles += `
html {
    filter: grayscale(100%);
}
`
        }

        return styles
    })

    const applyTheme = () => {
        const headParams: any = {
            style: [
                {
                    id: 'momei-theme-custom',
                    innerHTML: customStyles.value,
                },
            ],
            link: [],
        }

        // Favicon 定制
        if (settings.value?.theme_favicon_url) {
            headParams.link.push({
                rel: 'icon',
                href: settings.value.theme_favicon_url,
            })
        }

        useHead(headParams)
    }

    return {
        settings,
        fetchTheme,
        applyTheme,
        mourningMode,
    }
}
