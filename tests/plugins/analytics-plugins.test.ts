import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('analytics plugins basic guards', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        vi.unstubAllGlobals()
        document.head.innerHTML = ''
    })

    it('google analytics exposes no-op provider when id is missing', async () => {
        vi.stubGlobal('useRuntimeConfig', () => ({
            public: { googleAnalyticsId: '' },
        }))

        const plugin = await import('@/plugins/google-analytics.client')
        const result = await plugin.default({} as any)

        expect(result).toBeTruthy()
        if (!result) {
            throw new Error('Expected google analytics plugin to return provider in no-op mode')
        }
        if (!result.provide) {
            throw new Error('Expected google analytics provider to be available')
        }
        const googleAnalytics = result.provide.googleAnalytics
        expect(googleAnalytics.isLoaded()).toBe(false)
        expect(() => googleAnalytics.trackPageview()).not.toThrow()
        expect(() => googleAnalytics.trackEvent('click')).not.toThrow()
        expect(document.head.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull()
    })

    it('baidu analytics returns undefined when id is missing', async () => {
        vi.stubGlobal('useRuntimeConfig', () => ({
            public: { baiduAnalyticsId: '' },
        }))

        const plugin = await import('@/plugins/baidu-analytics.client')
        const result = plugin.default({} as any)

        expect(result).toBeUndefined()
        expect(document.head.querySelector('script[src*="hm.baidu.com/hm.js"]')).toBeNull()
    })

    it('clarity plugin returns undefined when project id is missing', async () => {
        vi.stubGlobal('useRuntimeConfig', () => ({
            public: { clarityProjectId: '' },
        }))

        const plugin = await import('@/plugins/clarity.client')
        const result = plugin.default({} as any)

        expect(result).toBeUndefined()
    })

    it('umami plugin does not inject scripts when config is missing', async () => {
        vi.stubGlobal('useRuntimeConfig', () => ({
            public: { umamiAnalytics: '' },
        }))

        const plugin = await import('@/plugins/umami-analytics.client')
        expect(() => plugin.default({} as any)).not.toThrow()
        expect(document.head.querySelector('script[data-website-id]')).toBeNull()
    })
})
