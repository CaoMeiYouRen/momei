import { useAppFetch } from './use-app-fetch'
import { useThemeMode } from './use-theme-mode'

export type ThemeMode = 'light' | 'dark'

export type ThemeBackgroundType = 'none' | 'color' | 'image' | (string & {})

export type ThemePresetKey = 'default' | 'green' | 'amber' | 'geek'

export type ThemePresetColorKey = 'primary' | 'accent' | 'surface' | 'text'

export type ThemePresetValueKey = ThemePresetColorKey | 'radius'

export type ThemeColorSettingKey =
    | 'themePrimaryColor'
    | 'themeAccentColor'
    | 'themeSurfaceColor'
    | 'themeTextColor'
    | 'themeDarkPrimaryColor'
    | 'themeDarkAccentColor'
    | 'themeDarkSurfaceColor'
    | 'themeDarkTextColor'

export type ThemePreviewColorSettingKey = ThemeColorSettingKey | 'themeBackgroundValue'

export type ThemeLockKey =
    | 'themePreset'
    | ThemeColorSettingKey
    | 'themeBorderRadius'
    | 'themeLogoUrl'
    | 'themeFaviconUrl'
    | 'themeMourningMode'
    | 'themeBackgroundType'
    | 'themeBackgroundValue'

export interface ThemePresetPalette {
    light: string
    dark: string
}

export interface ThemePresetDefinition {
    primary: ThemePresetPalette
    accent: ThemePresetPalette
    surface: ThemePresetPalette
    text: ThemePresetPalette
    radius: string
}

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
    themeBackgroundType: ThemeBackgroundType | null
    themeBackgroundValue: string | null
}

export const PRESETS: Record<ThemePresetKey, ThemePresetDefinition> = {
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
    useThemeMode()

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
    const locks = useState<Record<string, boolean>>('theme-locks', () => ({}))
    const settingsLoaded = useState<boolean>('theme-settings-loaded', () => false)

    interface ThemeSettingsResponse {
        data: ThemeSettings
        meta?: Record<string, { isLocked: boolean }>
    }

    const effectiveSettings = computed(() => previewSettings.value || settings.value)

    const fetchTheme = async (options?: { force?: boolean }) => {
        if (settingsLoaded.value && !options?.force) {
            return
        }

        const { data } = await useAppFetch<ThemeSettingsResponse>('/api/settings/theme')
        const payload = data.value as ThemeSettingsResponse | null

        if (payload) {
            settings.value = { ...settings.value, ...payload.data }
            if (payload.meta) {
                const newLocks: Record<string, boolean> = {}
                Object.entries(payload.meta).forEach(([key, val]) => {
                    newLocks[key] = val.isLocked
                })
                locks.value = newLocks
            }
            settingsLoaded.value = true
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

        const presetKey = (themePreset || 'default') as ThemePresetKey
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

        const generateVariables = (mode: ThemeMode) => {
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
    --m-accent-color: ${accent};

    /* 项目调色板层基色：--m-* 色阶在 styles/main.scss 中由这些基色派生（映射表见
     * docs/design/governance/2026-11-08-primevue-token-mapping.md）。 */
    --m-primary: ${primary};
    --m-primary-contrast: ${contrastColor};
    --m-surface: ${surface};
    --m-text-color: ${text};
    --m-radius: ${radius};
`
            // 如果是暖色或极客主题，微调 body 基础背景
            if (themePreset && themePreset !== 'default') {
                v += `    --m-surface-ground: ${surface};\n`
            }

            // 个性化背景颜色覆盖
            if (themeBackgroundType === 'color' && themeBackgroundValue) {
                const bgColor = formatColor(themeBackgroundValue, surface)
                v += `    --m-surface-ground: ${bgColor};\n`
            }

            return v
        }

        let styles = `
/* 与 styles/main.scss 同源声明层序：本段由 useHead 内联注入，可能早于外链 main.css 到达文档，
 * 若由这里的 \`@layer momei-overrides\` 先建立层序，primevue 会被排到其后并反向胜出
 * （表现为暗色下内容底色取到 Aura 的 surface.900 亮色）。前置声明保证
 * 无论注入先后，层序恒为 primevue → momei-base → momei-overrides。 */
@layer primevue, momei-base, momei-overrides;

@layer momei-overrides {
    :root {
        ${generateVariables('light')}
    }

    .dark {
        ${generateVariables('dark')}
    }

    body {
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
                const links: { rel: 'icon', href: string }[] = []
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

    const isLocked = (key: ThemeLockKey | (string & {})) => !!locks.value[key]

    return {
        settings,
        previewSettings,
        effectiveSettings,
        locks,
        settingsLoaded,
        isLocked,
        fetchTheme,
        applyTheme,
        mourningMode,
        customStyles,
    }
}
