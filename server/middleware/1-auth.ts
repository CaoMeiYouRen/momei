import { defineEventHandler, getHeader } from 'h3'

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

// /api/auth 始终需要 session 语义；其余情况下只在“公开接口但可能因登录态改变
// 可见性”且已经带有会话痕迹的路径上解析 session，避免匿名热点请求无差别拉入
// 鉴权与数据库初始化。
export function shouldResolveSession(pathname: string, cookieHeader: string | null | undefined) {
    if (pathname.startsWith('/api/auth')) {
        return true
    }

    if (!cookieHeader) {
        return false
    }

    if (!/(better-auth|session)/i.test(cookieHeader)) {
        return false
    }

    return OPTIONAL_SESSION_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname))
}

/**
 * 解析可选 session 并挂载到请求上下文。
 * 权限是否放行仍由 requireAuth / requireAdmin 等工具显式决定，
 * 中间件本身不负责把所有失败都转成阻断响应。
 */
export default defineEventHandler(async (event) => {
    try {
        const pathname = (event.path || '').split('?')[0] ?? ''
        const cookieHeader = getHeader(event, 'cookie')

        if (!shouldResolveSession(pathname, cookieHeader)) {
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
    } catch (error) {
        // 这里的失败不能直接等价成 401/403；否则公开接口会把“会话解析异常”
        // 误写成“业务拒绝访问”，后续定位会失真。
        const logger = await getAuthMiddlewareLogger()
        logger.error('Auth middleware error:', error)
    }
})
