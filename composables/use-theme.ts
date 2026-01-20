import { useDark } from '@vueuse/core'
import { useAppFetch } from './use-app-fetch'

export interface ThemeSettings {
    themePreset: string | null
    themePrimaryColor: string | null
    themeAccentColor: string | null
    themeBorderRadius: string | null
    themeLogoUrl: string | null
    themeFaviconUrl: string | null
    themeMourningMode: boolean | string | null
    themeBackgroundType: 'none' | 'color' | 'image' | string | null
    themeBackgroundValue: string | null
}

export const PRESETS = {
    default: {
        primary: { light: '#64748b', dark: '#94a3b8' },
        accent: { light: '#f43f5e', dark: '#fb7185' },
        surface: { light: '#ffffff', dark: '#020617' },
        text: { light: '#0f172a', dark: '#f1f5f9' },
        radius: '0.5rem',
    },
    green: {
        primary: { light: '#059669', dark: '#10b981' },
        accent: { light: '#10b981', dark: '#34d399' },
        surface: { light: '#f0fdf4', dark: '#052e16' },
        text: { light: '#064e3b', dark: '#ecfdf5' },
        radius: '0px',
    },
    amber: {
        primary: { light: '#d97706', dark: '#f59e0b' },
        accent: { light: '#f59e0b', dark: '#fbbf24' },
        surface: { light: '#fffbeb', dark: '#451a03' },
        text: { light: '#451a03', dark: '#fef3c7' },
        radius: '1rem',
    },
    geek: {
        primary: { light: '#7c3aed', dark: '#a855f7' },
        accent: { light: '#4c1d95', dark: '#06b6d4' },
        surface: { light: '#ffffff', dark: '#000000' },
        text: { light: '#1e1b4b', dark: '#f5f3ff' },
        radius: '4px',
    },
}

export const useTheme = () => {
    // 虽然 isDark 在 CSS 变量生成中不再直接使用（因为我们同时生成了亮暗两套变量），
    // 但 useDark 仍然需要保留以管理 html 端的 class 状态。
    useDark({
        selector: 'html',
        attribute: 'class',
        valueDark: 'dark',
        valueLight: '',
    })

    const settings = useState<ThemeSettings | null>('theme-settings', () => ({
        themePreset: 'default',
        themePrimaryColor: null,
        themeAccentColor: null,
        themeBorderRadius: null,
        themeLogoUrl: null,
        themeFaviconUrl: null,
        themeMourningMode: false,
        themeBackgroundType: 'none',
        themeBackgroundValue: null,
    }))

    const fetchTheme = async () => {
        const { data } = await useAppFetch<{ data: ThemeSettings }>('/api/settings/theme')
        if (data.value) {
            settings.value = { ...settings.value, ...data.value.data }
        }
    }

    const mourningMode = computed(() => {
        const val = settings.value?.themeMourningMode
        return val === true || val === 'true'
    })

    const customStyles = computed(() => {
        if (!settings.value) {
            return ''
        }

        const {
            themePreset,
            themePrimaryColor,
            themeAccentColor,
            themeBorderRadius,
            themeBackgroundType,
            themeBackgroundValue,
        } = settings.value

        const presetKey = (themePreset || 'default') as keyof typeof PRESETS
        const preset = PRESETS[presetKey] || PRESETS.default

        // 辅助函数：确保十六进制颜色以 # 开头且格式正确，否则 CSS 会失效
        const formatColor = (color: string | null | undefined, fallback: string) => {
            if (!color) {
                return fallback
            }
            const c = color.trim()
            if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(c)) {
                return `#${c}`
            }
            return c
        }

        const radius = themeBorderRadius || preset.radius

        const generateVariables = (mode: 'light' | 'dark') => {
            const primary = formatColor(themePrimaryColor, preset.primary[mode])
            const accent = formatColor(themeAccentColor, preset.accent[mode])
            const surface = preset.surface[mode]
            const text = preset.text[mode]

            let contrastColor = mode === 'dark' ? '#000' : '#fff'
            if (presetKey === 'geek' && mode === 'dark') {
                contrastColor = '#fff'
            } else if (primary.toLowerCase() === '#ffe411') {
                contrastColor = '#000'
            }

            let v = `
    --p-primary-50: color-mix(in srgb, ${primary}, white 95%);
    --p-primary-100: color-mix(in srgb, ${primary}, white 90%);
    --p-primary-200: color-mix(in srgb, ${primary}, white 70%);
    --p-primary-300: color-mix(in srgb, ${primary}, white 50%);
    --p-primary-400: color-mix(in srgb, ${primary}, white 20%);
    --p-primary-500: ${primary};
    --p-primary-600: color-mix(in srgb, ${primary}, black 20%);
    --p-primary-700: color-mix(in srgb, ${primary}, black 40%);
    --p-primary-800: color-mix(in srgb, ${primary}, black 60%);
    --p-primary-900: color-mix(in srgb, ${primary}, black 80%);

    --p-primary-color: ${primary};
    --p-primary-contrast-color: ${contrastColor};
    --p-primary-hover-color: color-mix(in srgb, ${primary}, black 10%);
    --p-primary-active-color: color-mix(in srgb, ${primary}, black 20%);

    --p-select-option-focus-background: var(--p-primary-100);
    --p-select-option-selected-background: var(--p-primary-500);
    --p-select-option-selected-color: var(--p-primary-contrast-color);

    --p-content-border-radius: ${radius};
    --p-surface-0: ${surface};
    --p-text-color: ${text};
    --m-accent-color: ${accent};
`
            // 如果是暖色或极客主题，微调 body 基础背景
            if (themePreset && themePreset !== 'default') {
                v += `    --p-surface-ground: ${surface};\n`
            }

            // 个性化背景颜色覆盖
            if (themeBackgroundType === 'color' && themeBackgroundValue) {
                const bgColor = formatColor(themeBackgroundValue, surface)
                v += `    --p-surface-ground: ${bgColor};\n`
            }

            return v
        }

        let styles = `
:root {
    ${generateVariables('light')}
}

.dark {
    ${generateVariables('dark')}
}

body {
    background-color: var(--p-surface-ground);
    color: var(--p-text-color);
}
`

        // 个性化背景图片覆盖 (由于 backgroundImage 通常是跨模式的，或者需要单独处理)
        if (themeBackgroundType === 'image' && themeBackgroundValue) {
            styles += `
body {
    background-image: url('${themeBackgroundValue}');
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
        // 使用 computed 确保样式能够响应式更新 (如暗色模式切换)
        useHead({
            style: [
                {
                    id: 'momei-theme-custom',
                    innerHTML: computed(() => customStyles.value),
                },
            ],
            link: computed(() => {
                const links: any[] = []
                if (settings.value?.themeFaviconUrl) {
                    links.push({
                        rel: 'icon',
                        href: settings.value.themeFaviconUrl,
                    })
                }
                return links
            }),
        })
    }

    return {
        settings,
        fetchTheme,
        applyTheme,
        mourningMode,
    }
}
