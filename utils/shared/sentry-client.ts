import type { Router } from 'vue-router'

export interface SentryPublicConfig {
    dsn?: string
    environment?: string
}

interface SentryErrorContext {
    captureContext?: { extra?: Record<string, unknown> }
    mechanism?: { handled: boolean, type: string }
}

interface PendingSentryError {
    error: unknown
    context?: SentryErrorContext
}

function isIgnoredStatusError(error: unknown) {
    if (!error || typeof error !== 'object') {
        return false
    }
    const candidate = error as { __nuxt_error?: unknown, status?: unknown, statusCode?: unknown }
    if (!('__nuxt_error' in candidate)) {
        return false
    }
    let status: number | undefined
    if (typeof candidate.status === 'number') {
        status = candidate.status
    } else if (typeof candidate.statusCode === 'number') {
        status = candidate.statusCode
    }
    return typeof status === 'number' && status >= 300 && status < 500
}

interface SentryNuxtApp {
    hook: (name: string, callback: (...args: unknown[]) => void) => void
}

/**
 * 动态初始化 Sentry 客户端，并订阅 Nuxt / Vue 错误钩子。
 *
 * 初始化完成前的错误先缓冲，SDK 就绪后统一上报；返回的 Promise 用于测试与失败兜底。
 */
export async function initializeSentryClient(
    nuxtApp: SentryNuxtApp,
    config: SentryPublicConfig,
    router: Router,
) {
    const pendingErrors: PendingSentryError[] = []
    let captureError: ((error: unknown, context?: SentryErrorContext) => void) | null = null

    const reportError = (error: unknown, context?: SentryErrorContext) => {
        if (captureError) {
            captureError(error, context)
            return
        }
        pendingErrors.push({ error, context })
    }

    nuxtApp.hook('vue:error', (error, _instance, info) => {
        if (isIgnoredStatusError(error)) {
            return
        }
        reportError(error, {
            captureContext: { extra: { info } },
            mechanism: { handled: false, type: 'nuxt' },
        })
    })
    nuxtApp.hook('app:error', (error) => {
        if (isIgnoredStatusError(error)) {
            return
        }
        reportError(error, { mechanism: { handled: false, type: 'nuxt' } })
    })

    const {
        init,
        browserTracingIntegration,
        captureException,
        replayIntegration,
    } = await import('@sentry/nuxt')

    init({
        dsn: config.dsn,
        environment: config.environment,
        integrations: [
            browserTracingIntegration({ router, routeLabel: 'path' }),
            replayIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0,
        // Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
    })

    captureError = (error, context) => {
        captureException(error, context)
    }

    for (const pending of pendingErrors.splice(0)) {
        captureException(pending.error, pending.context)
    }
}
