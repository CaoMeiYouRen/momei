import { initializeSentryClient } from '@/utils/shared/sentry-client'

/**
 * Sentry 客户端初始化。
 *
 * 不依赖 `sentry.client.config.ts` 的入口期初始化：后者会被 `@sentry/nuxt` 模块注入的客户端插件静态引入
 * Sentry SDK，使约 40KB(gzip) 进入首屏 preload。这里改为插件内动态导入，并自行订阅 Vue / Nuxt
 * 错误钩子；初始化完成前的错误先缓冲，完成后统一上报。
 */
export default defineNuxtPlugin((nuxtApp) => {
    const sentryConfig = useRuntimeConfig().public.sentry

    if (!sentryConfig?.dsn) {
        return
    }

    const router = useRouter()
    const hook = nuxtApp.hook as unknown as (
        name: string,
        callback: (...args: unknown[]) => void,
    ) => void

    void initializeSentryClient(
        { hook },
        sentryConfig,
        router,
    ).catch((error: unknown) => {
        console.warn('[sentry] 客户端初始化失败', error)
    })
})
