import { appendResponseHeader, defineEventHandler, getHeader, setHeader, type H3Event } from 'h3'

let authMiddlewareLoggerPromise: Promise<typeof import('@/server/utils/logger').default> | null = null

async function getAuthMiddlewareLogger() {
    authMiddlewareLoggerPromise ??= import('@/server/utils/logger').then((module) => module.default)
    return authMiddlewareLoggerPromise
}

const OPTIONAL_SESSION_ROUTE_PATTERNS = [
    /^\/api\/posts(?:\/|$)/,
    /^\/api\/search(?:\/|$)/,
    /^\/api\/friend-links\/applications(?:\/|$)/,
]

const HTML_ACCEPT_PATTERN = /\btext\/html\b/iu
const NON_PAGE_PATH_PREFIXES = ['/api/', '/_nuxt/', '/__nuxt']
const SESSION_COOKIE_PATTERN = /(better-auth|session)/iu

/**
 * 判定请求是否为一次 HTML 页面导航。
 *
 * 只有「GET + Accept: text/html + 非 API / 构建资源路径」才视为页面请求：静态资源与接口
 * 即便带会话 cookie 也不需要为 SSR 预置会话，避免把它们无差别拉进鉴权与数据库初始化。
 */
export function isHtmlPageRequest(options: { method?: string | null, pathname: string, accept?: string | null }) {
    const method = (options.method ?? 'GET').toUpperCase()

    if (method !== 'GET') {
        return false
    }

    const pathname = options.pathname.split('?')[0] ?? ''

    if (NON_PAGE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return false
    }

    return HTML_ACCEPT_PATTERN.test(options.accept ?? '')
}

/**
 * 共享缓存路由（SWR / ISR / cache / prerender）的 SSR HTML 会被多用户复用，
 * 一旦把会话种进 payload 就会串号；这类页面因此不参与页面级会话预置，
 * 保持「客户端自行解析」的原路径。
 */
export function isCacheSharedRouteRules(routeRules: SessionRouteRules | null | undefined) {
    if (!routeRules) {
        return false
    }

    return [routeRules.cache, routeRules.isr, routeRules.prerender, routeRules.static, routeRules.swr]
        .some((value) => typeof value !== 'undefined' && value !== false && value !== null && value !== 0)
}

// /api/auth 始终需要 session 语义；其余情况下只在「公开接口但可能因登录态改变
// 可见性」或「HTML 页面导航」且已经带有会话痕迹的路径上解析 session，避免匿名
// 热点请求无差别拉入鉴权与数据库初始化。
// 页面导航命中后，解析结果既供 SSR 首帧复用（见 plugins/auth-session.server.ts），
// 也替代页面路由中间件对 /api/auth/get-session 的回环请求。
export function shouldResolveSession(
    pathname: string,
    cookieHeader: string | null | undefined,
    options?: { isHtmlPageRequest?: boolean },
) {
    if (pathname.startsWith('/api/auth')) {
        return true
    }

    if (!cookieHeader) {
        return false
    }

    if (!SESSION_COOKIE_PATTERN.test(cookieHeader)) {
        return false
    }

    if (OPTIONAL_SESSION_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname))) {
        return true
    }

    return options?.isHtmlPageRequest === true && pathname !== '/api' && !pathname.startsWith('/api/')
}

export interface SessionRouteRules {
    cache?: unknown
    isr?: unknown
    prerender?: unknown
    static?: unknown
    swr?: unknown
}

export interface SessionResolutionInput {
    pathname: string
    cookieHeader: string | null | undefined
    isPageRequest: boolean
    routeRules?: SessionRouteRules | null
}

/**
 * 是否应为本次请求解析会话：在 `shouldResolveSession` 之上排除共享缓存页面，
 * 避免把登录态写进会被多用户复用的 SSR HTML / payload。
 */
export function shouldResolveSessionForRequest(input: SessionResolutionInput) {
    if (!shouldResolveSession(input.pathname, input.cookieHeader, { isHtmlPageRequest: input.isPageRequest })) {
        return false
    }

    return !(input.isPageRequest && isCacheSharedRouteRules(input.routeRules))
}

export type RouteRulesResolver = (event: H3Event) => SessionRouteRules | null | undefined

/**
 * 解析可选 session 并挂载到请求上下文。
 * 权限是否放行仍由 requireAuth / requireAdmin 等工具显式决定，
 * 中间件本身不负责把所有失败都转成阻断响应。
 *
 * `resolveRouteRules` 默认取 Nitro 的路由规则解析器；单测可注入固定规则，
 * 用于覆盖「共享缓存页面不种会话」的分支。
 */
export function createAuthSessionMiddleware(resolveRouteRules: RouteRulesResolver = (event) => getRouteRules(event)) {
    return defineEventHandler(async (event) => {
        try {
            const pathname = (event.path || '').split('?')[0] ?? ''
            const cookieHeader = getHeader(event, 'cookie')

            const isPageRequest = isHtmlPageRequest({
                accept: getHeader(event, 'accept'),
                method: event.method,
                pathname,
            })

            if (!isPageRequest) {
                // 非页面请求（接口 / 构建资源）没有渲染面，不需要判定路由缓存规则。
                if (!shouldResolveSession(pathname, cookieHeader, { isHtmlPageRequest: false })) {
                    return
                }
            } else if (!shouldResolveSessionForRequest({
                cookieHeader,
                isPageRequest,
                pathname,
                routeRules: resolveRouteRules(event),
            })) {
                return
            }

            const { dataSource, initializeDatabaseConnection } = await import('@/server/database')
            if (!dataSource.isInitialized) {
                // 可选 session 解析只需要连接与实体元数据可用，不应把维护型
                // initializeDB() 链路一并拉进公开请求首跳。
                await initializeDatabaseConnection()
            }
            const { auth } = await import('@/lib/auth')
            const session = await auth.api.getSession({
                headers: event.headers,
            })

            event.context.auth = session
            event.context.user = session?.user
            // 标记「已解析」而非「已登录」：会话为空也是有效结论，SSR 种子据此避免二次回环查询。
            event.context.authSessionResolved = true

            if (isPageRequest) {
                // 兜底：即使将来有人给页面加了 HTTP 层缓存规则，命中会话的响应也不得被共享复用。
                setHeader(event, 'cache-control', 'private, no-store')
                appendResponseHeader(event, 'vary', 'cookie')
            }
        } catch (error) {
            // 这里的失败不能直接等价成 401/403；否则公开接口会把「会话解析异常」
            // 误写成「业务拒绝访问」，后续定位会失真。
            const logger = await getAuthMiddlewareLogger()
            logger.error('Auth middleware error:', error)
        }
    })
}

export default createAuthSessionMiddleware()
