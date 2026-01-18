import { useDark } from '@vueuse/core'
import { useAppFetch } from './use-app-fetch'

export interface ThemeSettings {
    theme_preset: string | null
    theme_primary_color: string | null
    theme_accent_color: string | null
    theme_border_radius: string | null
    theme_logo_url: string | null
    theme_favicon_url: string | null
    theme_mourning_mode: boolean | string | null
    theme_background_type: 'none' | 'color' | 'image' | string | null
    theme_background_value: string | null
}

export const PRESETS = {
    default: {
        primary: { light: '#64748b', dark: '#94a3b8' },
        accent: { light: '#f43f5e', dark: '#fb7185' },
        surface: { light: '#ffffff', dark: '#020617' },
        text: { light: '#0f172a', dark: '#f1f5f9' },
        radius: '0.5rem',
    },
    geek: {
        primary: { light: '#059669', dark: '#10b981' },
        accent: { light: '#10b981', dark: '#34d399' },
        surface: { light: '#f0fdf4', dark: '#052e16' },
        text: { light: '#064e3b', dark: '#ecfdf5' },
        radius: '0px',
    },
    warm: {
        primary: { light: '#d97706', dark: '#f59e0b' },
        accent: { light: '#f59e0b', dark: '#fbbf24' },
        surface: { light: '#fffbeb', dark: '#451a03' },
        text: { light: '#451a03', dark: '#fef3c7' },
        radius: '1rem',
    },
}

export const useTheme = () => {
    const isDark = useDark({
        selector: 'html',
        attribute: 'class',
        valueDark: 'dark',
        valueLight: '',
    })

    const settings = useState<ThemeSettings | null>('theme-settings', () => ({
        theme_preset: 'default',
        theme_primary_color: null,
        theme_accent_color: null,
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
            theme_preset,
            theme_primary_color,
            theme_accent_color,
            theme_border_radius,
            theme_background_type,
            theme_background_value,
        } = settings.value

        const presetKey = (theme_preset || 'default') as keyof typeof PRESETS
        const preset = PRESETS[presetKey] || PRESETS.default
        const mode = isDark.value ? 'dark' : 'light'

        let styles = ''

        // 1. 基础预设变量注入
        styles += `
:root {
    --p-primary-500: ${theme_primary_color || preset.primary[mode]};
    --p-primary-color: ${theme_primary_color || preset.primary[mode]};
    --p-content-border-radius: ${theme_border_radius || preset.radius};
    --p-surface-0: ${preset.surface[mode]};
    --p-text-color: ${preset.text[mode]};

    // 增加点缀色变量 (用于梅红等强调色)
    --m-accent-color: ${theme_accent_color || preset.accent[mode]};
}
`

        // 如果是暖色或极客主题，微调 body 基础背景
        if (theme_preset && theme_preset !== 'default') {
            styles += `
body {
    background-color: ${preset.surface[mode]} !important;
}
`
        }

        // 2. 个性化背景定制覆盖
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

        // 3. 哀悼模式
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
