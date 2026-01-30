import { authClient } from '@/lib/auth-client'

/**
 * 身份验证中间件 (需要登录)
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
})
