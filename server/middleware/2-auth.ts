import { auth } from '@/lib/auth'
import { publicPaths } from '@/utils/shared/public-paths'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    // 白名单路径
    if (publicPaths.some((path) => event.path.startsWith(path))) {
        return
    }

    // API Auth routes are public
    if (event.path.startsWith('/api/auth')) {
        return
    }

    // Allow public access to GET /api/posts and POST /api/posts/:id/comments
    if (event.path.startsWith('/api/posts')) {
        if (event.method === 'GET') {
            return
        }
        if (event.method === 'POST' && event.path.endsWith('/comments')) {
            return
        }
        if (event.method === 'POST' && event.path.endsWith('/verify-password')) {
            return
        }
        if (event.method === 'POST' && event.path.endsWith('/views')) {
            return
        }
    }

    // Allow public access to GET /api/categories and GET /api/tags
    if (event.path.startsWith('/api/categories') || event.path.startsWith('/api/tags')) {
        if (event.method === 'GET') {
            return
        }
    }

    // Allow public access to GET /api/search
    if (event.path.startsWith('/api/search')) {
        if (event.method === 'GET') {
            return
        }
    }

    // 外部 API 路径不需要 session 验证
    if (event.path.startsWith('/api/external')) {
        return
    }

    // 订阅接口不需要 session 验证
    if (event.path === '/api/subscribe') {
        return
    }

    // 主题设置接口不需要 session 验证
    if (event.path === '/api/settings/theme' && event.method === 'GET') {
        return
    }

    // 仅拦截 API 请求
    if (event.path.startsWith('/api')) {
        if (!session) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized',
            })
        }
    }

})
