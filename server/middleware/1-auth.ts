import { auth } from '@/lib/auth'

/**
 * 身份验证中间件
 * 主要职责：解析 Session 并挂载到上下文，供后续处理程序或权限校验工具使用。
 * 注意：由于每个 API 已独立实现权限校验 (requireAuth/requireAdmin 等)，此中间件不再强制阻断请求。
 */
export default defineEventHandler(async (event) => {
    try {
        const session = await auth.api.getSession({
            headers: event.headers,
        })

        // 挂载到上下文以便后续处理程序或权限校验工具使用
        event.context.auth = session
        event.context.user = session?.user
    } catch (error) {
        // 身份验证失败不应阻断请求（由后续的权限校验工具决定是否阻断）
        // 但我们需要记录错误以备排查
        logger.error('Auth middleware error:', error)
    }
})
