import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import type { AuthClientSession } from '@/lib/auth-client'

/**
 * 认证会话 SSR 种子插件。
 *
 * 只做两件事的验证：
 * 1. 中间件标记「已解析」时，才把会话写进 `auth:route-session:*`（未标记的请求保持原回退路径）；
 * 2. 写入的值能让服务端 `resolveRouteAuthSession()` 判定为 fresh（resolved + 当前时间戳），
 *    从而不再发起 `/api/auth/get-session` 回环请求。
 */

const stateStore = vi.hoisted(() => new Map<string, Ref<unknown>>())
const requestEvent = vi.hoisted(() => ({ current: undefined as { context?: Record<string, unknown> } | undefined }))

mockNuxtImport('useState', () => <T>(key: string, init?: () => T) => {
    if (!stateStore.has(key)) {
        stateStore.set(key, ref(init ? init() : undefined) as Ref<unknown>)
    }

    return stateStore.get(key) as Ref<T>
})

mockNuxtImport('useRequestEvent', () => () => requestEvent.current)

const { default: authSessionPlugin, seedAuthRouteSession } = await import('@/plugins/auth-session.server')

const session = {
    session: { id: 'session-1' },
    user: { id: 'user-1', role: 'admin' },
} as unknown as AuthClientSession

/** `defineNuxtPlugin` 的返回函数带 nuxtApp 形参；本测试只关心它读取的 `useState` / `useRequestEvent`。 */
const runPlugin = () => (authSessionPlugin as unknown as () => void)()

describe('auth-session server plugin', () => {
    it('未标记已解析时不写状态', () => {
        stateStore.clear()
        requestEvent.current = { context: {} }

        runPlugin()

        expect(stateStore.get('auth:route-session:resolved')?.value).toBeUndefined()
        expect(stateStore.get('auth:route-session:data')).toBeUndefined()
    })

    it('已解析时种入会话并标记 resolved', () => {
        stateStore.clear()
        requestEvent.current = { context: { authSessionResolved: true, auth: session } }

        runPlugin()

        expect(stateStore.get('auth:route-session:data')?.value).toEqual(session)
        expect(stateStore.get('auth:route-session:resolved')?.value).toBe(true)
        expect(stateStore.get('auth:route-session:version')?.value).toBe(0)
        expect(typeof stateStore.get('auth:route-session:timestamp')?.value).toBe('number')
    })

    it('已解析但会话为空时同样种入空结果，避免二次回环', () => {
        stateStore.clear()
        requestEvent.current = { context: { authSessionResolved: true, auth: null } }

        runPlugin()

        expect(stateStore.get('auth:route-session:data')?.value).toBeNull()
        expect(stateStore.get('auth:route-session:resolved')?.value).toBe(true)
    })

    it('种子时间戳能被判定为新鲜（15s 窗口内）', () => {
        stateStore.clear()
        const resolvedAt = Date.now() - 1000

        seedAuthRouteSession(session, resolvedAt)

        expect(stateStore.get('auth:route-session:timestamp')?.value).toBe(resolvedAt)
        expect(Date.now() - resolvedAt).toBeLessThan(15_000)
    })
})
