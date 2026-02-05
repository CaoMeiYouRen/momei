import type { H3Event } from 'h3'
import { auth } from '@/lib/auth'
import { hasRole, UserRole } from '@/utils/shared/roles'

/**
 * 校验用户是否已登录
 * @param event H3Event
 */
export async function requireAuth(event: H3Event) {
    const session = event.context.auth || await auth.api.getSession({
        headers: event.headers,
    })

    if (!session?.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    return session
}

/**
 * 校验用户是否具有指定角色之一
 * @param event H3Event
 * @param roles 允许的角色列表
 */
export async function requireRole(event: H3Event, roles: UserRole[] | string[]) {
    const session = await requireAuth(event)

    if (!hasRole(session.user.role, roles)) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden',
        })
    }

    return session
}

/**
 * 校验用户是否为 Admin
 * @param event H3Event
 */
export async function requireAdmin(event: H3Event) {
    return requireRole(event, [UserRole.ADMIN])
}

/**
 * 校验用户是否为 Admin 或 Author
 * @param event H3Event
 */
export async function requireAdminOrAuthor(event: H3Event) {
    return requireRole(event, [UserRole.ADMIN, UserRole.AUTHOR])
}
