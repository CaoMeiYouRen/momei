import type { H3Event } from 'h3'
import { auth } from '@/lib/auth'

export type UserRole = 'admin' | 'author' | 'user' | 'visitor'

/**
 * 校验用户是否具有指定角色之一
 * @param event H3Event
 * @param roles 允许的角色列表
 */
export async function requireRole(event: H3Event, roles: UserRole[]) {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !session.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    if (!roles.includes(session.user.role as UserRole)) {
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
    return requireRole(event, ['admin'])
}

/**
 * 校验用户是否为 Admin 或 Author
 * @param event H3Event
 */
export async function requireAdminOrAuthor(event: H3Event) {
    return requireRole(event, ['admin', 'author'])
}
