import { authClient } from '@/lib/auth-client'
import { publicPaths } from '@/utils/shared/public-paths'
import { isAdminOrAuthor } from '@/utils/shared/roles'

export default defineNuxtRouteMiddleware(async (to) => {
    // 关键修复：在任何 await 之前获取 Nuxt 应用实例和组合式函数
    const { $i18n } = useNuxtApp()
    const localePath = useLocalePath()

    // 从 i18n 实例获取所有语言前缀
    const localePrefixes = $i18n.locales.value.map((l: any) => typeof l === 'string' ? l : l.code)

    // 获取不带语言前缀的基础路径
    const getBasePath = (path: string) => {
        const parts = path.split('/')
        if (parts.length > 1 && localePrefixes.includes(parts[1])) {
            return `/${parts.slice(2).join('/')}`
        }
        return path
    }

    const basePath = getBasePath(to.path)

    if (basePath === '/') {
        return true
    }
    if (publicPaths.some((path) => basePath.startsWith(path))) {
        return true
    }

    if (to.path.startsWith('/api/auth') && !to.path.startsWith('/api/auth/admin')) {
        return true
    }

    /**
     * TODO：优化 useFetch 里的 cookie 传递问题
     */
    const { data: session } = await authClient.useSession((url, options) => useFetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            ...useRequestHeaders(['cookie']),
        },
    }))

    // 检查用户是否登录
    if (!session.value) {
        // 重定向到登录页面
        return navigateTo(localePath('/login'))
    }

    // 管理后台权限检查
    if (basePath.startsWith('/admin') && !isAdminOrAuthor(session.value.user.role)) {
        return navigateTo(localePath('/'))
    }

    return true
})
