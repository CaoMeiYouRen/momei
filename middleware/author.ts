import { authClient } from '@/lib/auth-client'
import { isAdminOrAuthor } from '@/utils/shared/roles'

/**
 * 作者权限中间件 (需要登录且具有管理员或作者角色)
 */
export default defineNuxtRouteMiddleware(async () => {
    const localePath = useLocalePath()

    const { data: session } = await authClient.useSession((url, options) => useFetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            ...useRequestHeaders(['cookie']),
        },
    }))

    if (!session.value) {
        return navigateTo(localePath('/login'))
    }

    if (!isAdminOrAuthor(session.value.user.role)) {
        return navigateTo(localePath('/'))
    }
})
