import { useDark } from '@vueuse/core'
import { useAppFetch } from './use-app-fetch'

export interface ThemeSettings {
    themePreset: string | null
    themePrimaryColor: string | null
    themeAccentColor: string | null
    themeSurfaceColor: string | null
    themeTextColor: string | null
    themeDarkPrimaryColor: string | null
    themeDarkAccentColor: string | null
    themeDarkSurfaceColor: string | null
    themeDarkTextColor: string | null
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
        themeSurfaceColor: null,
        themeTextColor: null,
        themeDarkPrimaryColor: null,
        themeDarkAccentColor: null,
        themeDarkSurfaceColor: null,
        themeDarkTextColor: null,
        themeBorderRadius: null,
        themeLogoUrl: null,
        themeFaviconUrl: null,
        themeMourningMode: false,
        themeBackgroundType: 'none',
        themeBackgroundValue: null,
    }))

    const previewSettings = useState<ThemeSettings | null>('theme-preview-settings', () => null)
    const locks = useState<Record<string, boolean>>('theme-locks', () => ({}) as any)

    const effectiveSettings = computed(() => previewSettings.value || settings.value)

    const fetchTheme = async () => {
        const { data } = await useAppFetch<{ data: ThemeSettings, meta?: Record<string, { isLocked: boolean }> }>('/api/settings/theme')
        if (data.value) {
            settings.value = { ...settings.value, ...data.value.data }
            if (data.value.meta) {
                const newLocks: any = {}
                Object.entries(data.value.meta).forEach(([key, val]) => {
                    newLocks[key] = val.isLocked
                })
                locks.value = newLocks
            }
        }
    }

    const mourningMode = computed(() => {
        const val = effectiveSettings.value?.themeMourningMode
        return val === true || val === 'true'
    })

    const customStyles = computed(() => {
        if (!effectiveSettings.value) {
            return ''
        }

        const {
            themePreset,
            themePrimaryColor,
            themeAccentColor,
            themeSurfaceColor,
            themeTextColor,
            themeDarkPrimaryColor,
            themeDarkAccentColor,
            themeDarkSurfaceColor,
            themeDarkTextColor,
            themeBorderRadius,
            themeBackgroundType,
            themeBackgroundValue,
        } = effectiveSettings.value

        const presetKey = (themePreset || 'default') as keyof typeof PRESETS
        const preset = PRESETS[presetKey] || PRESETS.default

        // 辅助函数：确保十六进制颜色以 # 开头且格式正确，否则 CSS 会失效
        const formatColor = (color: string | null | undefined, fallback: string) => {
            if (!color || color === 'null' || color === 'undefined') {
                return fallback
            }
            const c = String(color).trim()
            if (!c || c === 'null' || c === 'undefined') {
                return fallback
            }
            return c.startsWith('#') ? c : `#${c}`
        }

        const radius = themeBorderRadius || preset.radius

        const generateVariables = (mode: 'light' | 'dark') => {
            const isDarkMode = mode === 'dark'

            // 核心逻辑：如果是深色模式且没有设置专门的深色覆盖，则优先尝试使用浅色覆盖，最后使用预设默认值
            // 修改：浅色覆盖不应该直接传导到深色模式，除非显式设置。即：深色模式下，如果没设深色主色，应回退到预设的深色主色。
            const primary = isDarkMode
                ? formatColor(themeDarkPrimaryColor, preset.primary[mode])
                : formatColor(themePrimaryColor, preset.primary[mode])

            const accent = isDarkMode
                ? formatColor(themeDarkAccentColor, preset.accent[mode])
                : formatColor(themeAccentColor, preset.accent[mode])

            const surface = isDarkMode
                ? formatColor(themeDarkSurfaceColor, preset.surface[mode])
                : formatColor(themeSurfaceColor, preset.surface[mode])

            const text = isDarkMode
                ? formatColor(themeDarkTextColor, preset.text[mode])
                : formatColor(themeTextColor, preset.text[mode])

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
    --p-primary-950: color-mix(in srgb, ${primary}, black 90%);

    --p-primary-color: ${primary};
    --p-primary-contrast-color: ${contrastColor};
    --p-primary-hover-color: color-mix(in srgb, ${primary}, ${isDarkMode ? 'white' : 'black'} 10%);
    --p-primary-active-color: color-mix(in srgb, ${primary}, ${isDarkMode ? 'white' : 'black'} 20%);

    --p-select-option-focus-background: var(--p-primary-100);
    --p-select-option-selected-background: var(--p-primary-500);
    --p-select-option-selected-color: var(--p-primary-contrast-color);

    --p-content-border-radius: ${radius};

    /* Surface mapping */
    --p-surface-0: ${surface};
    --p-surface-50: color-mix(in srgb, ${surface}, ${isDarkMode ? 'white' : 'black'} 2%);
    --p-surface-100: color-mix(in srgb, ${surface}, ${isDarkMode ? 'white' : 'black'} 4%);
    --p-surface-200: color-mix(in srgb, ${surface}, ${isDarkMode ? 'white' : 'black'} 8%);
    --p-surface-300: color-mix(in srgb, ${surface}, ${isDarkMode ? 'white' : 'black'} 12%);
    --p-surface-400: color-mix(in srgb, ${surface}, ${isDarkMode ? 'white' : 'black'} 20%);
    --p-surface-500: color-mix(in srgb, ${surface}, ${isDarkMode ? 'white' : 'black'} 30%);
    --p-surface-600: color-mix(in srgb, ${surface}, ${isDarkMode ? 'white' : 'black'} 45%);
    --p-surface-700: color-mix(in srgb, ${surface}, ${isDarkMode ? 'white' : 'black'} 60%);
    --p-surface-800: color-mix(in srgb, ${surface}, ${isDarkMode ? 'white' : 'black'} 80%);
    --p-surface-900: color-mix(in srgb, ${surface}, ${isDarkMode ? 'white' : 'black'} 90%);
    --p-surface-950: color-mix(in srgb, ${surface}, ${isDarkMode ? 'white' : 'black'} 95%);

    --p-content-background: var(--p-surface-0);
    --p-content-border-color: var(--p-surface-200);
    --p-navigation-background: var(--p-surface-0);
    --p-panel-background: var(--p-surface-0);
    --p-panel-content-background: var(--p-surface-0);
    --p-panel-header-background: var(--p-surface-0);
    --p-tabs-tab-background: var(--p-surface-0);
    --p-tabs-tab-active-background: var(--p-surface-0);
    --p-tabs-tab-list-background: var(--p-surface-0);
    --p-tabs-tabpanel-background: var(--p-surface-0);
    --p-card-background: var(--p-surface-0);
    --p-select-background: var(--p-surface-0);
    --p-select-list-background: var(--p-surface-0);

    --p-text-color: ${text};
    --p-text-muted-color: color-mix(in srgb, ${text}, ${surface} 40%);
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
@layer momei-overrides {
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
    html, body {
        filter: grayscale(100%) !important;
    }
`
        }

        styles += '\n}'

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
                if (effectiveSettings.value?.themeFaviconUrl) {
                    links.push({
                        rel: 'icon',
                        href: effectiveSettings.value.themeFaviconUrl,
                    })
                }
                return links
            }),
        })
    }

    const isLocked = (key: keyof ThemeSettings | string) => !!locks.value[key]

    return {
        settings,
        previewSettings,
        effectiveSettings,
        locks,
        isLocked,
        fetchTheme,
        applyTheme,
        mourningMode,
        customStyles,
    }
}
