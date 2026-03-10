import { authClient } from '@/lib/auth-client'
import { isAdmin } from '@/utils/shared/roles'

/**
 * 管理员权限中间件 (需要登录且具有管理员角色)
 */
export default defineNuxtRouteMiddleware(async (to) => {
    const localePath = useLocalePath()

    const { data: session } = await authClient.useSession((url, options) => useFetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            ...useRequestHeaders(['cookie']),
        },
    }))

    if (!session.value) {
        return navigateTo({
            path: localePath('/login'),
            query: {
                redirect: to.fullPath,
            },
        })
    }

    if (!isAdmin(session.value.user.role)) {
        return navigateTo(localePath('/'))
    }
})
