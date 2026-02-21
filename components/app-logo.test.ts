import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppLogo from './app-logo.vue'
import { useMomeiConfig } from '@/composables/use-momei-config'

// Mock useMomeiConfig
vi.mock('@/composables/use-momei-config', () => ({
    useMomeiConfig: vi.fn(() => ({
        siteLogo: '/test-logo.png',
        currentTitle: 'Test Blog',
    })),
}))

// Mock useLocalePath
vi.stubGlobal('useLocalePath', () => (path: string) => `/test${path}`)

describe('AppLogo', () => {
    it('renders with custom logo from config', async () => {
        const wrapper = await mountSuspended(AppLogo, {
            props: {
                size: 40,
                showTitle: true,
            },
        })

        const img = wrapper.find('img')
        expect(img.exists()).toBe(true)
        expect(img.attributes('src')).toBe('/test-logo.png')
        expect(img.attributes('width')).toBe('40')
        expect(img.attributes('height')).toBe('40')

        const title = wrapper.find('.app-logo__title')
        expect(title.exists()).toBe(true)
        expect(title.text()).toBe('Test Blog')
    })

    it('renders default logo when config logo is missing', async () => {
        // Mock specifically for this test
        vi.mocked(useMomeiConfig).mockReturnValueOnce({
            siteLogo: '',
            currentTitle: 'Default Logo Title',
        } as any)

        const wrapper = await mountSuspended(AppLogo, {
            props: {
                showTitle: true,
            },
        })

        const img = wrapper.find('img')
        expect(img.attributes('src')).toBe('/logo.png')
        expect(wrapper.text()).toContain('Default Logo Title')
    })

    it('hides title when showTitle is false', async () => {
        const wrapper = await mountSuspended(AppLogo, {
            props: {
                showTitle: false,
            },
        })

        expect(wrapper.find('.app-logo__title').exists()).toBe(false)
    })

    it('uses correct locale path', async () => {
        const wrapper = await mountSuspended(AppLogo)
        const link = wrapper.find('a')
        expect(link.attributes('href')).toBe('/')
    })
})
