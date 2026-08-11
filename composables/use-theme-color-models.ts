import { computed, type Ref, type WritableComputedRef } from 'vue'
import {
    PRESETS,
    type ThemeMode,
    type ThemePresetColorKey,
    type ThemePresetKey,
    type ThemePresetValueKey,
    type ThemePreviewColorSettingKey,
    type ThemeSettings,
} from '@/composables/use-theme'

/**
 * 解析主题预设 key，非法值回退到 'default'
 */
export function resolveThemePresetKey(preset: string | null | undefined): ThemePresetKey {
    return preset && preset in PRESETS ? preset as ThemePresetKey : 'default'
}

/**
 * 从当前 settings 取出预设值；支持颜色 key 与 'radius'，支持强制按暗色模式取
 */
export function getPresetValue(
    settings: ThemeSettings | null,
    type: ThemePresetValueKey,
    forceDark = false,
): string {
    if (!settings) {
        return ''
    }
    const presetKey = resolveThemePresetKey(settings.themePreset)
    const preset = PRESETS[presetKey] || PRESETS.default
    if (!preset) {
        return ''
    }
    if (type === 'radius') {
        return preset.radius || ''
    }
    const mode: ThemeMode = forceDark ? 'dark' : 'light'
    return preset[type][mode] || ''
}

/**
 * 颜色字段的文本 input 双向绑定；空值映射为 null，自动补 '#'
 */
export function createThemeColorModel(
    settings: Ref<ThemeSettings | null>,
    key: ThemePreviewColorSettingKey,
): WritableComputedRef<string> {
    return computed({
        get: () => {
            const val = settings.value?.[key]
            if (!val) {
                return ''
            }
            return val.startsWith('#') ? val : `#${val}`
        },
        set: (newVal: string) => {
            if (settings.value) {
                if (!newVal) {
                    settings.value[key] = null
                    return
                }
                settings.value[key] = newVal.startsWith('#') ? newVal : `#${newVal}`
            }
        },
    })
}

/**
 * 颜色字段的 ColorPicker 双向绑定；空值回退到预设默认，且去掉 '#' 前缀以匹配 ColorPicker 格式
 *
 * `isExtraDarkField` 用于扩展 dark 字段的判定规则（例如 preview 侧把
 * `themeBackgroundValue` 在暗色模式下也视作 dark 字段，从 surface 预设取暗色默认值）
 */
export function createThemeColorPickerModel<K extends ThemePreviewColorSettingKey>(
    settings: Ref<ThemeSettings | null>,
    key: K,
    colorTypeMap: Record<K, ThemePresetColorKey>,
    isExtraDarkField?: (key: K) => boolean,
): WritableComputedRef<string> {
    return computed({
        get: () => {
            let val = settings.value?.[key]
            if (!val) {
                const isDarkField = key.toLowerCase().includes('dark')
                    || (isExtraDarkField ? isExtraDarkField(key) : false)
                val = getPresetValue(settings.value, colorTypeMap[key], isDarkField)
            }
            return val ? val.replace('#', '') : ''
        },
        set: (newVal: string) => {
            if (settings.value) {
                settings.value[key] = newVal.startsWith('#') ? newVal : `#${newVal}`
            }
        },
    })
}
