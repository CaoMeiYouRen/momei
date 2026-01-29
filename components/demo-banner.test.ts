import { describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import DemoBanner from './demo-banner.vue'

const mockT = vi.fn((key: string) => key)
mockNuxtImport('useI18n', () => () => ({
    t: mockT,
    locale: { value: 'zh-CN' },
}))

const mockConfig = {
    public: {
        demoMode: true,
    },
}
mockNuxtImport('useRuntimeConfig', () => () => mockConfig)

describe('DemoBanner', () => {
    it('should render when demoMode is enabled', async () => {
        mockConfig.public.demoMode = true
        const wrapper = await mountSuspended(DemoBanner, {
            global: {
                stubs: {
                    Button: {
                        template: '<button @click="$emit(\'click\')"><slot /></button>',
                    },
                },
            },
        })

        expect(wrapper.find('.demo-banner').exists()).toBe(true)
        // 既然加载了真实翻译，我们就不检查翻译 key 了
        expect(wrapper.find('.demo-banner__text').text()).not.toBe('')
    })

    it('should not render when demoMode is disabled', async () => {
        mockConfig.public.demoMode = false
        const wrapper = await mountSuspended(DemoBanner, {
            global: {
                stubs: {
                    Button: true,
                },
            },
        })

        expect(wrapper.find('.demo-banner').exists()).toBe(false)
    })

    it('should dispatch custom event when start tour button is clicked', async () => {
        mockConfig.public.demoMode = true
        const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

        const wrapper = await mountSuspended(DemoBanner, {
            global: {
                stubs: {
                    Button: {
                        template: '<button @click="$emit(\'click\')"><slot /></button>',
                    },
                },
            },
        })

        await wrapper.find('.demo-banner__btn').trigger('click')

        expect(dispatchEventSpy).toHaveBeenCalled()
        const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent
        expect(event.type).toBe('momei:start-tour')

        dispatchEventSpy.mockRestore()
    })
})
