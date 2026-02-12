import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useReaderMode } from './use-reader-mode'

// 模拟 @vueuse/core 的 useStorage
vi.mock('@vueuse/core', async () => {
    const actual = await vi.importActual('@vueuse/core') as any
    return {
        ...actual,
        useStorage: (key: string, initialValue: any) => {
            const state = { value: initialValue }
            return state
        },
    }
})

describe('useReaderMode', () => {
    beforeEach(() => {
        // 模拟浏览器环境
        vi.stubGlobal('document', {
            body: {
                classList: {
                    add: vi.fn(),
                    remove: vi.fn(),
                },
                style: {
                    backgroundColor: '',
                    color: '',
                },
            },
            documentElement: {
                style: {
                    setProperty: vi.fn(),
                },
            },
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('should initialize with default values', () => {
        const { settings } = useReaderMode()
        expect(settings.value.active).toBe(false)
        expect(settings.value.fontSize).toBe(18)
        expect(settings.value.theme).toBe('default')
    })

    it('should toggle reader mode', () => {
        const { settings, toggleReaderMode } = useReaderMode()

        toggleReaderMode(true)
        expect(settings.value.active).toBe(true)
        expect(document.body.classList.add).toHaveBeenCalledWith('reader-mode-active')

        toggleReaderMode(false)
        expect(settings.value.active).toBe(false)
        expect(document.body.classList.remove).toHaveBeenCalledWith('reader-mode-active')
    })

    it('should update CSS variables when mode is active', () => {
        const { settings, toggleReaderMode, updateCSSVariables } = useReaderMode()

        settings.value.fontSize = 20
        settings.value.theme = 'sepia'
        toggleReaderMode(true)
        updateCSSVariables()

        expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--reader-font-size', '20px')
        // Sepia theme background check
        expect(document.body.style.backgroundColor).toBe('#f4ecd8')
    })
})
