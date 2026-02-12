import { useStorage } from '@vueuse/core'
import { watch, onMounted } from 'vue'

export type ReaderTheme = 'default' | 'sepia' | 'eye-care' | 'dark-night'

export interface ReaderSettings {
    active: boolean
    fontSize: number
    lineHeight: number
    width: number
    theme: ReaderTheme
}

// 提升到模块作用域，实现状态共享单例
const settings = useStorage<ReaderSettings>('momei-reader-settings', {
    active: false,
    fontSize: 18,
    lineHeight: 1.8,
    width: 800,
    theme: 'default',
})

export const useReaderMode = () => {
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
                // 重置变量
                const root = document.documentElement
                root.style.removeProperty('--reader-bg')
                root.style.removeProperty('--reader-text')
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
                // 默认模式
                bg = ''
                text = ''
        }

        if (settings.value.active) {
            // 设置关键变量
            root.style.setProperty('--reader-bg', bg || 'inherit')
            root.style.setProperty('--reader-text', text || 'inherit')

            // 直接应用背景到 body 以确保即时性
            if (bg) {
                document.body.style.setProperty('background-color', bg, 'important')
                document.body.style.setProperty('color', text, 'important')
            } else {
                document.body.style.backgroundColor = ''
                document.body.style.color = ''
            }
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
