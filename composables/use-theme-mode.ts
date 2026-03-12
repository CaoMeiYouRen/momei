import { useDark } from '@vueuse/core'

export const THEME_STORAGE_KEY = 'theme'

export function useThemeMode() {
    return useDark({
        selector: 'html',
        attribute: 'class',
        valueDark: 'dark',
        valueLight: '',
        storageKey: THEME_STORAGE_KEY,
    })
}
