import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BaiduAnalyticsMethods } from '@/types/baidu-analytics'
import type { GoogleAnalyticsMethods } from '@/types/google-analytics'

interface GoogleProviderResult { provide: { googleAnalytics: GoogleAnalyticsMethods } }
interface BaiduProviderResult { provide: { baiduAnalytics: BaiduAnalyticsMethods } }

/**
 * 分析类客户端插件的注入与公开方法覆盖。
 *
 * - 配置缺失时保持「零注入 / 空实现」；
 * - 配置存在时验证 script 注入、idle 回调、路由跟踪与公开 API 分支；
 * - umami 额外覆盖已注入去重、已存在 script 复用与非法配置拒绝。
 *
 * 说明：`useRuntimeConfig` / `useRouter` 由 Nuxt 自动导入在构建期绑定，测试里不能用
 * `vi.stubGlobal` 替换；这里改为在测试中直接读写真实 runtimeConfig 与 router，
 * 避免 `mockNuxtImport` 替换后破坏 `@nuxt/test-utils` 自身的应用装配。
 */

const ANALYTICS_CONFIG_KEYS = [
    'googleAnalyticsId',
    'baiduAnalyticsId',
    'clarityProjectId',
    'umamiAnalytics',
] as const

function setRuntimeConfig(config: Record<string, unknown>) {
    const runtimeConfig = useRuntimeConfig()
    const publicConfig = runtimeConfig.public as Record<string, unknown>

    for (const key of ANALYTICS_CONFIG_KEYS) {
        publicConfig[key] = ''
    }

    Object.assign(publicConfig, config)
}

function installIdleCallback() {
    const idleCallback = vi.fn((callback: () => void, _options?: { timeout?: number }) => {
        callback()
        return 1
    })
    vi.stubGlobal('requestIdleCallback', idleCallback)
    return idleCallback
}

function spyOnRouterAfterEach() {
    return vi.spyOn(useRouter(), 'afterEach')
}

describe('analytics plugins basic guards', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        vi.unstubAllGlobals()
        setRuntimeConfig({})
        document.head.innerHTML = ''
        document.body.innerHTML = ''
        delete (window as { _hmt?: unknown })._hmt
        delete (window as { gtag?: unknown }).gtag
        delete (window as { dataLayer?: unknown }).dataLayer
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('google analytics exposes no-op provider when id is missing', async () => {
        const plugin = await import('@/plugins/google-analytics.client')
        const result = await plugin.default({} as never) as GoogleProviderResult | undefined

        expect(result).toBeTruthy()
        if (!result?.provide) {
            throw new Error('Expected google analytics provider to be available')
        }
        const googleAnalytics = result.provide.googleAnalytics
        expect(googleAnalytics.isLoaded()).toBe(false)
        expect(() => googleAnalytics.trackPageview()).not.toThrow()
        expect(() => googleAnalytics.trackEvent('click')).not.toThrow()
        expect(() => googleAnalytics.setUserProperties({ plan: 'free' })).not.toThrow()
        expect(() => googleAnalytics.setConfig('G-EMPTY')).not.toThrow()
        expect(document.head.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull()
    })

    it('google analytics injects gtag.js and tracks routes when configured', async () => {
        setRuntimeConfig({ googleAnalyticsId: 'G-TEST' })
        const idleCallback = installIdleCallback()
        const afterEachSpy = spyOnRouterAfterEach()

        const plugin = await import('@/plugins/google-analytics.client')
        const result = await plugin.default({} as never) as GoogleProviderResult | undefined

        expect(idleCallback).toHaveBeenCalledTimes(1)
        expect(idleCallback.mock.calls[0]?.[1]).toEqual({ timeout: 3000 })
        const script = document.head.querySelector<HTMLScriptElement>('script[src*="googletagmanager.com/gtag/js?id=G-TEST"]')
        expect(script).not.toBeNull()
        expect(script?.async).toBe(true)
        expect(script?.defer).toBe(true)
        expect(window.dataLayer).toEqual([
            ['js', expect.any(Date)],
            ['config', 'G-TEST'],
        ])
        expect(afterEachSpy).toHaveBeenCalledTimes(1)

        const routeCallback = afterEachSpy.mock.calls[0]?.[0] as (to: { fullPath: string }) => void
        document.title = '墨梅'
        routeCallback({ fullPath: '/posts/1' })

        expect(window.dataLayer).toEqual([
            ['js', expect.any(Date)],
            ['config', 'G-TEST'],
            ['config', 'G-TEST', { page_path: '/posts/1', page_title: '墨梅' }],
        ])

        const googleAnalytics = result!.provide.googleAnalytics
        googleAnalytics.trackPageview({ page_path: '/about' })
        googleAnalytics.trackEvent('click', { label: 'nav' })
        googleAnalytics.setUserProperties({ plan: 'pro' })
        googleAnalytics.setConfig('G-OTHER', { send_page_view: false })

        expect(window.dataLayer).toEqual([
            ['js', expect.any(Date)],
            ['config', 'G-TEST'],
            ['config', 'G-TEST', { page_path: '/posts/1', page_title: '墨梅' }],
            ['config', 'G-TEST', { page_path: '/about' }],
            ['event', 'click', { label: 'nav' }],
            ['set', { plan: 'pro' }],
            ['config', 'G-OTHER', { send_page_view: false }],
        ])
        expect(googleAnalytics.isLoaded()).toBe(true)
    })

    it('google analytics falls back to a timer when requestIdleCallback is unavailable', async () => {
        setRuntimeConfig({ googleAnalyticsId: 'G-TIMER' })
        Reflect.deleteProperty(window, 'requestIdleCallback')
        vi.useFakeTimers()
        try {
            const plugin = await import('@/plugins/google-analytics.client')
            await plugin.default({} as never)

            expect(document.head.querySelector('script[src*="G-TIMER"]')).toBeNull()
            vi.advanceTimersByTime(2000)
            expect(document.head.querySelector('script[src*="G-TIMER"]')).not.toBeNull()
        } finally {
            vi.useRealTimers()
        }
    })

    it('baidu analytics returns undefined when id is missing', async () => {
        const plugin = await import('@/plugins/baidu-analytics.client')
        const result = plugin.default({} as never) as BaiduProviderResult | undefined

        expect(result).toBeUndefined()
        expect(document.head.querySelector('script[src*="hm.baidu.com/hm.js"]')).toBeNull()
    })

    it('baidu analytics appends the tracker and exposes the provider methods', async () => {
        setRuntimeConfig({ baiduAnalyticsId: 'baidu-1' })
        installIdleCallback()
        const afterEachSpy = spyOnRouterAfterEach()

        const plugin = await import('@/plugins/baidu-analytics.client')
        const result = plugin.default({} as never) as BaiduProviderResult | undefined

        expect(result).toBeTruthy()
        const script = document.head.querySelector<HTMLScriptElement>('script[src="https://hm.baidu.com/hm.js?baidu-1"]')
        expect(script).not.toBeNull()
        expect(script?.defer).toBe(true)
        expect(Array.isArray(window._hmt)).toBe(true)
        expect(afterEachSpy).toHaveBeenCalledTimes(1)

        const routeCallback = afterEachSpy.mock.calls[0]?.[0] as (to: { fullPath: string }) => void
        routeCallback({ fullPath: '/tags' })
        expect(window._hmt).toEqual([['_trackPageview', '/tags']])

        const baiduAnalytics = result!.provide.baiduAnalytics
        baiduAnalytics.trackPageview()
        baiduAnalytics.trackPageview('/archives')
        baiduAnalytics.trackEvent('category', 'action', 'label', 2)
        baiduAnalytics.trackEvent('category', 'action', 'label')
        baiduAnalytics.trackEvent('category', 'action')
        baiduAnalytics.setCustomVar(1, 'name', 'value', 2)
        baiduAnalytics.setCustomVar(6, 'ignored', 'value', 2)

        expect(window._hmt).toEqual([
            ['_trackPageview', '/tags'],
            ['_trackPageview'],
            ['_trackPageview', '/archives'],
            ['_trackEvent', 'category', 'action', 'label', 2],
            ['_trackEvent', 'category', 'action', 'label'],
            ['_trackEvent', 'category', 'action'],
            ['_setCustomVar', 1, 'name', 'value', 2],
        ])
        expect(baiduAnalytics.isLoaded()).toBe(true)
    })

    it('baidu analytics inserts before the first script tag when one exists', async () => {
        setRuntimeConfig({ baiduAnalyticsId: 'baidu-2' })
        installIdleCallback()
        const firstScript = document.createElement('script')
        firstScript.id = 'first-script'
        document.head.appendChild(firstScript)

        const plugin = await import('@/plugins/baidu-analytics.client')
        await plugin.default({} as never)

        const insertedScript = document.head.querySelector<HTMLScriptElement>('script[src*="baidu-2"]')
        expect(insertedScript).not.toBeNull()
        expect(insertedScript?.nextElementSibling?.id).toBe('first-script')
    })

    it('baidu analytics falls back to a timer when requestIdleCallback is unavailable', async () => {
        setRuntimeConfig({ baiduAnalyticsId: 'baidu-3' })
        Reflect.deleteProperty(window, 'requestIdleCallback')
        vi.useFakeTimers()
        try {
            const plugin = await import('@/plugins/baidu-analytics.client')
            await plugin.default({} as never)

            expect(document.head.querySelector('script[src*="baidu-3"]')).toBeNull()
            vi.advanceTimersByTime(2000)
            expect(document.head.querySelector('script[src*="baidu-3"]')).not.toBeNull()
        } finally {
            vi.useRealTimers()
        }
    })

    it('clarity plugin returns undefined when project id is missing', async () => {
        const plugin = await import('@/plugins/clarity.client')
        const result = plugin.default({} as never)

        expect(result).toBeUndefined()
    })

    it('umami plugin does not inject scripts when config is missing', async () => {
        const plugin = await import('@/plugins/umami-analytics.client')
        expect(() => plugin.default({} as never)).not.toThrow()
        expect(document.head.querySelector('script[data-website-id]')).toBeNull()
    })

    it('umami plugin injects once for a valid config and reuses an existing script', async () => {
        setRuntimeConfig({ umamiAnalytics: JSON.stringify({ websiteId: 'website-1' }) })

        const plugin = await import('@/plugins/umami-analytics.client')
        await plugin.default({} as never)

        const script = document.head.querySelector<HTMLScriptElement>('script[data-website-id="website-1"]')
        expect(script).not.toBeNull()
        expect(script?.src).toBe('https://analytics.umami.is/script.js')
        expect(script?.defer).toBe(true)

        // 第二次调用命中 hasInjected 短路，不会再插入第二个 script
        await plugin.default({} as never)
        expect(document.head.querySelectorAll('script[data-website-id="website-1"]')).toHaveLength(1)

        // 已存在的 script 被识别为已注入，不重复插入
        const injectedState = useState<boolean>('umami-analytics-injected', () => false)
        injectedState.value = false
        document.head.innerHTML = ''
        const existing = document.createElement('script')
        existing.src = 'https://analytics.umami.is/script.js'
        existing.setAttribute('data-website-id', 'website-1')
        document.head.appendChild(existing)

        await plugin.default({} as never)
        expect(document.head.querySelectorAll('script[data-website-id="website-1"]')).toHaveLength(1)
    })

    it('umami plugin rejects invalid config payloads', async () => {
        setRuntimeConfig({ umamiAnalytics: 'not-json' })

        const plugin = await import('@/plugins/umami-analytics.client')
        await plugin.default({} as never)

        expect(document.head.querySelector('script[data-website-id]')).toBeNull()
    })
})
