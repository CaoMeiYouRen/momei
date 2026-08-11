import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import {
    PRESETS,
    type ThemePresetColorKey,
    type ThemePreviewColorSettingKey,
    type ThemeSettings,
} from './use-theme'
import {
    createThemeColorModel,
    createThemeColorPickerModel,
    getPresetValue,
    resolveThemePresetKey,
} from './use-theme-color-models'

function makeSettings(overrides: Partial<ThemeSettings> = {}): ThemeSettings {
    return {
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
        ...overrides,
    }
}

describe('resolveThemePresetKey', () => {
    it('returns the preset key when it exists in PRESETS', () => {
        expect(resolveThemePresetKey('green')).toBe('green')
        expect(resolveThemePresetKey('geek')).toBe('geek')
    })

    it('falls back to "default" for unknown / null / undefined', () => {
        expect(resolveThemePresetKey('unknown')).toBe('default')
        expect(resolveThemePresetKey(null)).toBe('default')
        expect(resolveThemePresetKey(undefined)).toBe('default')
    })
})

describe('getPresetValue', () => {
    it('returns empty string when settings is null', () => {
        expect(getPresetValue(null, 'primary')).toBe('')
    })

    it('returns radius from preset for "radius" type', () => {
        const settings = makeSettings({ themePreset: 'green' })
        expect(getPresetValue(settings, 'radius')).toBe(PRESETS.green.radius)
    })

    it('returns light palette value by default and dark value when forceDark=true', () => {
        const settings = makeSettings({ themePreset: 'default' })
        expect(getPresetValue(settings, 'primary', false)).toBe(PRESETS.default.primary.light)
        expect(getPresetValue(settings, 'primary', true)).toBe(PRESETS.default.primary.dark)
    })

    it('falls back to default preset when themePreset is invalid', () => {
        const settings = makeSettings({ themePreset: 'unknown-preset' })
        expect(getPresetValue(settings, 'primary', false)).toBe(PRESETS.default.primary.light)
    })
})

describe('createThemeColorModel', () => {
    it('returns empty string when value is null', () => {
        const settings = ref<ThemeSettings | null>(makeSettings({ themePrimaryColor: null }))
        const model = createThemeColorModel(settings, 'themePrimaryColor')
        expect(model.value).toBe('')
    })

    it('auto-prefixes "#" on get when missing', () => {
        const settings = ref<ThemeSettings | null>(makeSettings({ themePrimaryColor: '64748b' }))
        const model = createThemeColorModel(settings, 'themePrimaryColor')
        expect(model.value).toBe('#64748b')
    })

    it('keeps "#" prefix when present on get', () => {
        const settings = ref<ThemeSettings | null>(makeSettings({ themePrimaryColor: '#64748b' }))
        const model = createThemeColorModel(settings, 'themePrimaryColor')
        expect(model.value).toBe('#64748b')
    })

    it('sets null when new value is empty', () => {
        const settings = ref<ThemeSettings | null>(makeSettings({ themePrimaryColor: '#64748b' }))
        const model = createThemeColorModel(settings, 'themePrimaryColor')
        model.value = ''
        expect(settings.value?.themePrimaryColor).toBeNull()
    })

    it('auto-prefixes "#" on set when missing', () => {
        const settings = ref<ThemeSettings | null>(makeSettings())
        const model = createThemeColorModel(settings, 'themePrimaryColor')
        model.value = 'f43f5e'
        expect(settings.value?.themePrimaryColor).toBe('#f43f5e')
    })

    it('keeps "#" prefix when present on set', () => {
        const settings = ref<ThemeSettings | null>(makeSettings())
        const model = createThemeColorModel(settings, 'themePrimaryColor')
        model.value = '#f43f5e'
        expect(settings.value?.themePrimaryColor).toBe('#f43f5e')
    })

    it('guards null settings without throwing', () => {
        const settings = ref<ThemeSettings | null>(null)
        const model = createThemeColorModel(settings, 'themePrimaryColor')
        expect(model.value).toBe('')
        model.value = '#64748b'
        expect(settings.value).toBeNull()
    })
})

describe('createThemeColorPickerModel', () => {
    const colorTypeMap: Record<ThemePreviewColorSettingKey, ThemePresetColorKey> = {
        themePrimaryColor: 'primary',
        themeAccentColor: 'accent',
        themeSurfaceColor: 'surface',
        themeTextColor: 'text',
        themeDarkPrimaryColor: 'primary',
        themeDarkAccentColor: 'accent',
        themeDarkSurfaceColor: 'surface',
        themeDarkTextColor: 'text',
        themeBackgroundValue: 'surface',
    }

    it('returns value without "#" when settings has a color', () => {
        const settings = ref<ThemeSettings | null>(makeSettings({ themePrimaryColor: '#64748b' }))
        const model = createThemeColorPickerModel(settings, 'themePrimaryColor', colorTypeMap)
        expect(model.value).toBe('64748b')
    })

    it('falls back to preset light value when settings value is null', () => {
        const settings = ref<ThemeSettings | null>(makeSettings({ themePrimaryColor: null }))
        const model = createThemeColorPickerModel(settings, 'themePrimaryColor', colorTypeMap)
        expect(model.value).toBe(PRESETS.default.primary.light.replace('#', ''))
    })

    it('falls back to preset dark value for keys containing "dark"', () => {
        const settings = ref<ThemeSettings | null>(makeSettings({ themeDarkPrimaryColor: null }))
        const model = createThemeColorPickerModel(settings, 'themeDarkPrimaryColor', colorTypeMap)
        expect(model.value).toBe(PRESETS.default.primary.dark.replace('#', ''))
    })

    it('uses isExtraDarkField callback to extend dark field detection (themeBackgroundValue)', () => {
        const settings = ref<ThemeSettings | null>(makeSettings({ themeBackgroundValue: null }))
        const isExtraDarkField = (k: ThemePreviewColorSettingKey) => k === 'themeBackgroundValue'
        const model = createThemeColorPickerModel(settings, 'themeBackgroundValue', colorTypeMap, isExtraDarkField)
        // themeBackgroundValue maps to 'surface' and isExtraDarkField returns true → dark branch
        expect(model.value).toBe(PRESETS.default.surface.dark.replace('#', ''))
    })

    it('ignores isExtraDarkField when callback returns false', () => {
        const settings = ref<ThemeSettings | null>(makeSettings({ themeBackgroundValue: null }))
        const isExtraDarkField = () => false
        const model = createThemeColorPickerModel(settings, 'themeBackgroundValue', colorTypeMap, isExtraDarkField)
        // key does not contain 'dark' and callback returns false → light branch
        expect(model.value).toBe(PRESETS.default.surface.light.replace('#', ''))
    })

    it('auto-prefixes "#" on set and keeps input', () => {
        const settings = ref<ThemeSettings | null>(makeSettings({ themePrimaryColor: null }))
        const model = createThemeColorPickerModel(settings, 'themePrimaryColor', colorTypeMap)
        model.value = 'f43f5e'
        expect(settings.value?.themePrimaryColor).toBe('#f43f5e')
        model.value = '#abc123'
        expect(settings.value?.themePrimaryColor).toBe('#abc123')
    })

    it('guards null settings without throwing', () => {
        const settings = ref<ThemeSettings | null>(null)
        const model = createThemeColorPickerModel(settings, 'themePrimaryColor', colorTypeMap)
        expect(model.value).toBe('')
        model.value = '#64748b'
        expect(settings.value).toBeNull()
    })
})
