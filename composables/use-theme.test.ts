import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useTheme, PRESETS } from './use-theme'
import { useAppFetch } from './use-app-fetch'

const { mockUseHead } = vi.hoisted(() => ({
    mockUseHead: vi.fn(),
}))

mockNuxtImport('useHead', () => mockUseHead)

// Mock useAppFetch
vi.mock('./use-app-fetch', () => ({
    useAppFetch: vi.fn(),
}))

// Mock @vueuse/core useDark
vi.mock('@vueuse/core', () => ({
    useDark: vi.fn(),
}))

describe('useTheme', () => {
    let sharedSettings: any
    let sharedSettingsLoaded: any
    let sharedPreviewSettings: any
    let sharedLocks: any

    beforeEach(() => {
        vi.clearAllMocks()
        const theme = useTheme()
        sharedSettings = theme.settings
        sharedSettingsLoaded = theme.settingsLoaded
        sharedPreviewSettings = theme.previewSettings
        sharedLocks = theme.locks
        sharedSettings.value = {
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
        }
        sharedPreviewSettings.value = null
        sharedLocks.value = {}
        sharedSettingsLoaded.value = false
    })

    it('should initialize with default settings', () => {
        const { settings } = useTheme()
        expect(settings.value).toMatchObject({
            themePreset: 'default',
            themeMourningMode: false,
            themeBackgroundType: 'none',
        })
    })

    it('should compute mourningMode correctly', () => {
        const { settings, mourningMode } = useTheme()

        settings.value!.themeMourningMode = true
        expect(mourningMode.value).toBe(true)

        settings.value!.themeMourningMode = 'true'
        expect(mourningMode.value).toBe(true)

        settings.value!.themeMourningMode = false
        expect(mourningMode.value).toBe(false)

        settings.value!.themeMourningMode = null
        expect(mourningMode.value).toBe(false)
    })

    it('should generate custom styles for default preset', () => {
        const { customStyles } = useTheme()
        const styles = customStyles.value

        expect(styles).toContain(':root')
        expect(styles).toContain('.dark')
        expect(styles).toContain('--p-primary-500: #64748b') // Default light primary
        expect(styles).toContain('--m-accent-color: #f43f5e') // Default light accent
    })

    it('should apply custom primary color', () => {
        const { settings, customStyles } = useTheme()
        settings.value!.themePrimaryColor = 'ff0000'

        const styles = customStyles.value
        expect(styles).toContain('--p-primary-500: #ff0000')
    })

    it('should apply dark mode overrides', () => {
        const { settings, customStyles } = useTheme()
        settings.value!.themeDarkPrimaryColor = '#00ff00'

        const styles = customStyles.value
        // Check if dark class contains the green color
        const darkSection = styles.split('.dark')[1]
        expect(darkSection).toContain('--p-primary-500: #00ff00')
    })

    it('should handle different background types', () => {
        const { settings, customStyles } = useTheme()

        // Color background
        settings.value!.themeBackgroundType = 'color'
        settings.value!.themeBackgroundValue = '#f0f0f0'
        expect(customStyles.value).toContain('--p-surface-ground: #f0f0f0')

        // Image background
        settings.value!.themeBackgroundType = 'image'
        settings.value!.themeBackgroundValue = 'http://example.com/bg.jpg'
        expect(customStyles.value).toContain('background-image: url(\'http://example.com/bg.jpg\')')
    })

    it('should apply mourning mode styles', () => {
        const { settings, customStyles } = useTheme()
        settings.value!.themeMourningMode = true

        expect(customStyles.value).toContain('filter: grayscale(100%) !important')
    })

    it('should switch presets correctly', () => {
        const { settings, customStyles } = useTheme()
        settings.value!.themePreset = 'geek'

        const styles = customStyles.value
        expect(styles).toContain(`--p-primary-500: ${PRESETS.geek.primary.light}`)
        expect(styles).toContain('--p-surface-ground: #ffffff') // From geek preset logic
    })

    it('should skip fetching theme after it has already been loaded', async () => {
        vi.mocked(useAppFetch).mockReturnValue({
            data: {
                value: {
                    data: {
                        themePreset: 'amber',
                    },
                },
            },
        } as any)

        const { fetchTheme, settings, settingsLoaded } = useTheme()

        await fetchTheme()

        expect(settingsLoaded.value).toBe(true)
        expect(settings.value?.themePreset).toBe('amber')

        vi.mocked(useAppFetch).mockClear()
        await fetchTheme()

        expect(useAppFetch).not.toHaveBeenCalled()
    })

    it('should merge lock metadata and re-fetch when forced', async () => {
        vi.mocked(useAppFetch).mockReturnValue({
            data: {
                value: {
                    data: {
                        themePreset: 'green',
                        themeFaviconUrl: '/favicon-green.ico',
                    },
                    meta: {
                        themePreset: { isLocked: true },
                        themeFaviconUrl: { isLocked: false },
                    },
                },
            },
        } as any)

        const { fetchTheme, locks, isLocked } = useTheme()

        await fetchTheme({ force: true })

        expect(locks.value).toEqual({
            themePreset: true,
            themeFaviconUrl: false,
        })
        expect(isLocked('themePreset')).toBe(true)
        expect(isLocked('themeBackgroundType')).toBe(false)
    })

    it('should allow preview settings to override persisted settings', () => {
        const { settings, previewSettings, effectiveSettings } = useTheme()
        settings.value!.themePrimaryColor = '#111111'
        previewSettings.value = {
            ...settings.value!,
            themePrimaryColor: '#222222',
        }

        expect(effectiveSettings.value?.themePrimaryColor).toBe('#222222')
        expect(useTheme().customStyles.value).toContain('--p-primary-500: #222222')
    })

    it('should apply head metadata with style and favicon links', () => {
        const { settings, applyTheme } = useTheme()
        settings.value!.themeFaviconUrl = '/favicon.ico'

        applyTheme()

        expect(mockUseHead).toHaveBeenCalledTimes(1)
        const payload = mockUseHead.mock.calls[0]?.[0] as {
            style: { id: string, innerHTML: { value: string } }[]
            link: { value: { rel: string, href: string }[] }
        }
        expect(payload.style[0]?.id).toBe('momei-theme-custom')
        expect(payload.style[0]?.innerHTML.value).toContain('@layer momei-overrides')
        expect(payload.link.value).toEqual([{ rel: 'icon', href: '/favicon.ico' }])
    })

    it('should fall back when custom colors are blank-like strings and use readable contrast for bright primary', () => {
        const { settings, customStyles } = useTheme()
        settings.value!.themePrimaryColor = ' #ffe411 '
        settings.value!.themeAccentColor = 'undefined'
        settings.value!.themeSurfaceColor = 'null'

        const styles = customStyles.value
        expect(styles).toContain('--p-primary-500: #ffe411')
        expect(styles).toContain('--p-primary-contrast-color: #000')
        expect(styles).toContain(`--m-accent-color: ${PRESETS.default.accent.light}`)
    })
})
