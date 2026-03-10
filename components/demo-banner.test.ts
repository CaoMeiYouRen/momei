import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import DemoBanner from './demo-banner.vue'

const { mockConfig, mockNavigateTo, mockRoute, mockT } = vi.hoisted(() => {
    return {
        mockT: vi.fn((key: string, params?: Record<string, string>) => {
            if (params?.stage) {
                return `${key}:${params.stage}`
            }

            return key
        }),
        mockNavigateTo: vi.fn(),
        mockRoute: {
            path: '/',
        },
        mockConfig: {
            app: {
                baseURL: '/',
                buildAssetsDir: '/_nuxt/',
                cdnURL: '',
            },
            public: {
                demoMode: true,
                sentry: {
                    dsn: '',
                    environment: 'test',
                },
            },
        },
    }
})

mockNuxtImport('useI18n', () => () => ({
    t: mockT,
    locale: { value: 'zh-CN' },
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useLocalePath', () => () => (path: string) => path)
mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('useRuntimeConfig', () => () => mockConfig)

describe('DemoBanner', () => {
    beforeEach(() => {
        mockConfig.public.demoMode = true
        mockRoute.path = '/'
        mockRoute.fullPath = '/'
        mockNavigateTo.mockReset()
        localStorage.clear()
    })

    it('should render when demoMode is enabled', async () => {
        const wrapper = await mountSuspended(DemoBanner)

        expect(wrapper.find('.demo-banner').exists()).toBe(true)
        expect(wrapper.find('.demo-banner__text').text()).not.toBe('')
        expect(wrapper.findAll('.demo-banner__path')).toHaveLength(3)
    })

    it('should not render when demoMode is disabled', async () => {
        mockConfig.public.demoMode = false
        const wrapper = await mountSuspended(DemoBanner)

        expect(wrapper.find('.demo-banner').exists()).toBe(false)
    })

    it('should dispatch custom event when start tour button is clicked', async () => {
        const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

        const wrapper = await mountSuspended(DemoBanner)

        await wrapper.find('.demo-banner__btn').trigger('click')

        expect(dispatchEventSpy).toHaveBeenCalled()
        const event = dispatchEventSpy.mock.calls[0]![0] as CustomEvent
        expect(event.type).toBe('momei:start-tour')

        dispatchEventSpy.mockRestore()
    })

    it('should queue the next onboarding stage and navigate when opening a demo path', async () => {
        const wrapper = await mountSuspended(DemoBanner)

        await wrapper.findAll('.demo-banner__path')[2]!.trigger('click')

        expect(localStorage.getItem('momei_demo_next_stage')).toBe('editor')
        expect(mockNavigateTo).toHaveBeenCalledWith('/admin/posts/new')
    })

    it('should collapse the banner and persist preference', async () => {
        const wrapper = await mountSuspended(DemoBanner)

        await wrapper.find('.demo-banner__toggle').trigger('click')

        expect(wrapper.find('.demo-banner__paths').exists()).toBe(false)
        expect(localStorage.getItem('momei_demo_banner_collapsed')).toBe('true')
    })

    it('should default to collapsed on admin routes', async () => {
        mockRoute.path = '/admin/posts'
        mockRoute.fullPath = '/admin/posts'

        const wrapper = await mountSuspended(DemoBanner)

        expect(wrapper.find('.demo-banner__paths').exists()).toBe(false)
        expect(wrapper.find('.demo-banner__btn--primary').exists()).toBe(true)
    })
})
