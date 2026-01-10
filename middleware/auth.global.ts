import { authClient } from '@/lib/auth-client'
import { publicPaths } from '@/utils/shared/public-paths'

export default defineNuxtRouteMiddleware(async (to) => {
    if (to.path === '/') {
        return true
    }
    if (publicPaths.some((path) => to.path === path)) {
        return true
    }
    if (to.path.startsWith('/posts')) {
        return true
    }
    if (to.path.startsWith('/api/auth') && !to.path.startsWith('/api/auth/admin')) {
        return true
    }
    /**
     * TODO：优化 useFetch 里的 cookie 传递问题
     * 在这里手动转发 cookie，以确保在中间件中正确获取会话信息。
     * 可能是 better-auth 或 Nuxt 处理请求头的方式变更导致的问题，所以需要手动处理。
     * （原本默认使用 useFetch 应该就会处理 cookie）
     * 需要再观察一下，以采用更优雅的解决方案。
     */
    const { data: session } = await authClient.useSession((url, options) => useFetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            ...useRequestHeaders(['cookie']),
        },
    }))
    // console.info('session.value', session.value)
    // 检查用户是否登录
    if (!session.value) {
        // 重定向到登录页面
        return navigateTo('/login')
    }

    // 管理后台权限检查
    if (to.path.startsWith('/admin') && session.value.user.role !== 'admin') {
        return navigateTo('/')
    }

    return true
})
