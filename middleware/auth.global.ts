import { authClient } from '@/lib/auth-client'
import { publicPaths } from '@/utils/shared/public-paths'

export default defineNuxtRouteMiddleware(async (to) => {
    if (publicPaths.some((path) => to.path === path)) {
        return true
    }
    if (to.path.startsWith('/api/auth') && !to.path.startsWith('/api/auth/admin')) {
        return true
    }
    const { data: session } = await authClient.useSession(useFetch)
    console.info('Auth Middleware - Current Session:')
    console.info(session.value)
    // 检查用户是否登录
    if (!session.value) {
        // 重定向到登录页面
        // if (to.path !== '/login') {
        //     return navigateTo('/login')
        // }
        // return false

    }
    return true
})
