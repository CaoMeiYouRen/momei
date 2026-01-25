import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTheme, PRESETS } from './use-theme'

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

    beforeEach(() => {
        vi.clearAllMocks()
        const theme = useTheme()
        sharedSettings = theme.settings
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
})
