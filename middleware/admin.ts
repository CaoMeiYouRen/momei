import { resolveRouteAuthSession } from '@/composables/use-auth-session'
import { isAdmin } from '@/utils/shared/roles'

/**
 * 管理员权限中间件 (需要登录且具有管理员角色)
 */
export default defineNuxtRouteMiddleware(async (to) => {
    const localePath = useLocalePath()

    const session = await resolveRouteAuthSession()

    if (!session) {
        return navigateTo({
            path: localePath('/login'),
            query: {
                redirect: to.fullPath,
            },
        })
    }

    if (!isAdmin(session.user.role)) {
        return navigateTo(localePath('/'))
    }
})
