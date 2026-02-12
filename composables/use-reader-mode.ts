import { useStorage } from '@vueuse/core'

export type ReaderTheme = 'default' | 'sepia' | 'eye-care' | 'dark-night'

export interface ReaderSettings {
    active: boolean
    fontSize: number
    lineHeight: number
    width: number
    theme: ReaderTheme
}

export const useReaderMode = () => {
    const settings = useStorage<ReaderSettings>('momei-reader-settings', {
        active: false,
        fontSize: 18,
        lineHeight: 1.8,
        width: 800,
        theme: 'default',
    })

    const toggleReaderMode = (val?: boolean) => {
        settings.value.active = val !== undefined ? val : !settings.value.active

        // 当进入模式时，添加全局类名到 body
        if (import.meta.client) {
            if (settings.value.active) {
                document.body.classList.add('reader-mode-active')
                updateCSSVariables()
            } else {
                document.body.classList.remove('reader-mode-active')
                // 恢复默认背景
                document.body.style.backgroundColor = ''
                document.body.style.color = ''
            }
        }
    }

    const updateCSSVariables = () => {
        if (!import.meta.client) {
            return
        }

        const root = document.documentElement
        root.style.setProperty('--reader-font-size', `${settings.value.fontSize}px`)
        root.style.setProperty('--reader-line-height', `${settings.value.lineHeight}`)
        root.style.setProperty('--reader-width', `${settings.value.width}px`)

        // 处理主题颜色
        let bg = ''
        let text = ''

        switch (settings.value.theme) {
            case 'sepia':
                bg = '#f4ecd8'
                text = '#5b4636'
                break
            case 'eye-care':
                bg = '#c7edcc'
                text = '#2c3e50'
                break
            case 'dark-night':
                bg = '#1a1a1b'
                text = '#d7dadc'
                break
            default:
                // 默认主题下不强制背景，跟随系统
                bg = ''
                text = ''
        }

        if (settings.value.active) {
            document.body.style.backgroundColor = bg
            document.body.style.color = text
            // Markdown 内容区域也需要跟随
            root.style.setProperty('--reader-bg', bg || 'inherit')
            root.style.setProperty('--reader-text', text || 'inherit')
        }
    }

    // 监听设置变化
    watch(() => settings.value, () => {
        if (settings.value.active) {
            updateCSSVariables()
        }
    }, { deep: true })

    // 初始化检查
    onMounted(() => {
        if (settings.value.active) {
            toggleReaderMode(true)
        }
    })

    return {
        settings,
        toggleReaderMode,
        updateCSSVariables,
    }
}
