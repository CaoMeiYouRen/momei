import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Router } from 'vue-router'
import { initializeSentryClient } from './sentry-client'

const sentryMocks = vi.hoisted(() => ({
    browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
    captureException: vi.fn(),
    init: vi.fn(),
    replayIntegration: vi.fn(() => ({ name: 'Replay' })),
}))

vi.mock('@sentry/nuxt', () => ({
    browserTracingIntegration: sentryMocks.browserTracingIntegration,
    captureException: sentryMocks.captureException,
    init: sentryMocks.init,
    replayIntegration: sentryMocks.replayIntegration,
}))

function createNuxtApp() {
    const hooks = new Map<string, (...args: unknown[]) => void>()
    return {
        hooks,
        nuxtApp: {
            hook: (name: string, callback: (...args: unknown[]) => void) => {
                hooks.set(name, callback)
            },
        },
    }
}

describe('initializeSentryClient', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('以原配置初始化 SDK 并注册 Vue / Nuxt 错误钩子', async () => {
        const { hooks, nuxtApp } = createNuxtApp()
        const router = {} as Router

        await initializeSentryClient(nuxtApp, { dsn: 'https://example.com/1', environment: 'test' }, router)

        expect(sentryMocks.init).toHaveBeenCalledWith(expect.objectContaining({
            dsn: 'https://example.com/1',
            environment: 'test',
            integrations: [
                { name: 'BrowserTracing' },
                { name: 'Replay' },
            ],
            replaysOnErrorSampleRate: 1.0,
            replaysSessionSampleRate: 0.1,
            tracesSampleRate: 1.0,
        }))
        expect(sentryMocks.browserTracingIntegration).toHaveBeenCalledWith({ router, routeLabel: 'path' })
        expect(hooks.has('vue:error')).toBe(true)
        expect(hooks.has('app:error')).toBe(true)
    })

    it('初始化完成前的错误先缓冲，SDK 就绪后补报', async () => {
        const { hooks, nuxtApp } = createNuxtApp()
        const pending = initializeSentryClient(nuxtApp, { dsn: 'https://example.com/1' }, {} as Router)

        hooks.get('vue:error')?.(new Error('render failed'), {}, 'render function')
        await pending

        expect(sentryMocks.captureException).toHaveBeenCalledTimes(1)
        expect(sentryMocks.captureException).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                captureContext: { extra: { info: 'render function' } },
                mechanism: { handled: false, type: 'nuxt' },
            }),
        )
    })

    it('跳过 3xx / 4xx 的 Nuxt 导航类错误（status / statusCode 两种形态）', async () => {
        const { hooks, nuxtApp } = createNuxtApp()
        await initializeSentryClient(nuxtApp, { dsn: 'https://example.com/1' }, {} as Router)

        hooks.get('app:error')?.({ __nuxt_error: true, statusCode: 404 })
        hooks.get('app:error')?.({ __nuxt_error: true, status: 302 })

        expect(sentryMocks.captureException).not.toHaveBeenCalled()
    })

    it('5xx Nuxt 错误与无 __nuxt_error 的 4xx 必须上报', async () => {
        const { hooks, nuxtApp } = createNuxtApp()
        await initializeSentryClient(nuxtApp, { dsn: 'https://example.com/1' }, {} as Router)

        hooks.get('app:error')?.({ __nuxt_error: true, statusCode: 500 })
        hooks.get('app:error')?.({ statusCode: 404 })

        expect(sentryMocks.captureException).toHaveBeenCalledTimes(2)
    })

    it('初始化完成后的错误直接上报', async () => {
        const { hooks, nuxtApp } = createNuxtApp()
        await initializeSentryClient(nuxtApp, { dsn: 'https://example.com/1' }, {} as Router)

        hooks.get('app:error')?.(new Error('app failed'))

        expect(sentryMocks.captureException).toHaveBeenCalledTimes(1)
    })
})
