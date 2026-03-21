import { resolveRouteAuthSession } from '@/composables/use-auth-session'
import { isAdminOrAuthor } from '@/utils/shared/roles'

/**
 * 作者权限中间件 (需要登录且具有管理员或作者角色)
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

    if (!isAdminOrAuthor(session.user.role)) {
        return navigateTo(localePath('/'))
    }
})
