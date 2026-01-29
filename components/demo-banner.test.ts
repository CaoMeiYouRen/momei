import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DemoBanner from './demo-banner.vue'

describe('DemoBanner', () => {
    it('should render when demoMode is enabled', () => {
        const wrapper = mount(DemoBanner, {
            global: {
                stubs: {
                    Button: {
                        template: '<button @click="$emit(\'click\')"><slot /></button>',
                    },
                },
                mocks: {
                    $t: (key: string) => key,
                    useRuntimeConfig: () => ({
                        public: {
                            demoMode: true,
                        },
                    }),
                },
            },
        })

        expect(wrapper.find('.demo-banner').exists()).toBe(true)
        expect(wrapper.find('.demo-banner__text').text()).toBe('demo.banner_text')
    })

    it('should not render when demoMode is disabled', () => {
        const wrapper = mount(DemoBanner, {
            global: {
                stubs: {
                    Button: true,
                },
                mocks: {
                    $t: (key: string) => key,
                    useRuntimeConfig: () => ({
                        public: {
                            demoMode: false,
                        },
                    }),
                },
            },
        })

        expect(wrapper.find('.demo-banner').exists()).toBe(false)
    })

    it('should dispatch custom event when start tour button is clicked', async () => {
        const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

        const wrapper = mount(DemoBanner, {
            global: {
                stubs: {
                    Button: {
                        template: '<button @click="$emit(\'click\')"><slot /></button>',
                    },
                },
                mocks: {
                    $t: (key: string) => key,
                    useRuntimeConfig: () => ({
                        public: {
                            demoMode: true,
                        },
                    }),
                },
            },
        })

        await wrapper.findComponent({ name: 'Button' }).trigger('click')

        expect(dispatchEventSpy).toHaveBeenCalled()
        const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent
        expect(event.type).toBe('momei:start-tour')

        dispatchEventSpy.mockRestore()
    })
})
