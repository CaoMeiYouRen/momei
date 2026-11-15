import { type AuthClientSession, getAuthSessionCacheBustVersion } from '@/lib/auth-client'

/**
 * 认证会话的 SSR 种子（仅服务端）。
 *
 * `server/middleware/1-auth.ts` 已在页面导航上解析过会话并挂到 `event.context.auth`；本插件把
 * 该结果一次性写入 `auth:route-session:*` 状态，使页面组件在 SSR 首帧即可拿到会话，而不是
 * 依赖客户端二次请求后再补渲染（那正是 `settings/profile` 曾经使用 `ClientOnly` 的原因）。
 *
 * 为什么走 `useState` 而不是新增接口或改 Better-Auth：`useState` 天然随 Nuxt payload 序列化，
 * 客户端首帧与 SSR 完全同源，避免 hydration mismatch；同时 `resolveRouteAuthSession()` 在
 * 服务端读到已 resolved 的状态后不再发起 `/api/auth/get-session` 回环请求。
 *
 * 只写「已解析」的请求：未命中页面判定（匿名、静态资源、接口）时不种状态，保持原有回退路径。
 */
export function seedAuthRouteSession(session: AuthClientSession, resolvedAt = Date.now()) {
    useState<AuthClientSession>('auth:route-session:data', () => null).value = session
    useState<boolean>('auth:route-session:resolved', () => false).value = true
    useState<number>('auth:route-session:timestamp', () => 0).value = resolvedAt
    // 服务端缓存失效版本恒为初始值，与客户端首帧一致；跨标签页失效由客户端监听覆盖。
    useState<number>('auth:route-session:version', () => 0).value = getAuthSessionCacheBustVersion()
}

export default defineNuxtPlugin(() => {
    const event = useRequestEvent()

    if (!event?.context?.authSessionResolved) {
        return
    }

    seedAuthRouteSession((event.context.auth ?? null) as AuthClientSession)
})
