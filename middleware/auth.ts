import { resolveRouteAuthSession } from '@/composables/use-auth-session'

/**
 * 身份验证中间件 (需要登录)
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
})
