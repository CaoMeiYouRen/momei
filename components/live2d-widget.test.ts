import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { nextTick, reactive, ref } from 'vue'

const mockRoute = reactive({
    path: '/',
})

const mockSiteConfig = ref({
    live2dEnabled: true,
})

const mockRunWhenIdle = vi.fn()
const mockCanLoadEffect = vi.fn(() => true)

mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('useI18n', () => () => ({
    availableLocales: ['zh-CN', 'en-US'],
}))
mockNuxtImport('useMomeiConfig', () => () => ({
    siteConfig: mockSiteConfig,
}))
mockNuxtImport('useClientEffectGuard', () => () => ({
    canLoadEffect: mockCanLoadEffect,
    runWhenIdle: mockRunWhenIdle,
}))

import Live2dWidget from './live2d-widget.vue'

let wrapper: { unmount: () => void } | null = null

describe('Live2dWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRoute.path = '/'
        mockSiteConfig.value = {
            live2dEnabled: true,
        }
        document.body.innerHTML = ''
    })

    afterEach(() => {
        wrapper?.unmount()
        wrapper = null
        document.body.innerHTML = ''
    })

    it('should schedule init on public content pages', async () => {
        mockRoute.path = '/en-US/about'

        wrapper = await mountSuspended(Live2dWidget)

        expect(mockRunWhenIdle).toHaveBeenCalledTimes(1)
    })

    it('should not schedule init on restricted pages', async () => {
        mockRoute.path = '/zh-CN/login'

        wrapper = await mountSuspended(Live2dWidget)

        expect(mockRunWhenIdle).not.toHaveBeenCalled()
    })

    it('should allow article detail routes with locale prefix', async () => {
        mockRoute.path = '/zh-CN/posts/hello-world'

        wrapper = await mountSuspended(Live2dWidget)

        expect(mockRunWhenIdle).toHaveBeenCalledTimes(1)
    })

    it('should hide and restore injected widget when route visibility changes', async () => {
        const waifu = document.createElement('div')
        waifu.id = 'waifu'
        waifu.style.display = 'none'
        document.body.appendChild(waifu)

        const toggle = document.createElement('div')
        toggle.id = 'waifu-toggle'
        toggle.style.display = 'none'
        document.body.appendChild(toggle)

        mockRoute.path = '/about'
        wrapper = await mountSuspended(Live2dWidget)

        expect(waifu.style.display).toBe('')
        expect(toggle.style.display).toBe('')

        mockRoute.path = '/submit'
        await nextTick()

        expect(waifu.style.display).toBe('none')
        expect(toggle.style.display).toBe('none')

        mockRoute.path = '/zh-CN/posts/demo'
        await nextTick()

        expect(waifu.style.display).toBe('')
        expect(toggle.style.display).toBe('')
    })
})
