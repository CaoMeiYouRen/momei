import { getRequestURL } from 'h3'
import { auth } from '@/lib/auth'
import { publicPaths } from '@/utils/shared/public-paths'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    const { pathname: path } = getRequestURL(event)

    // 白名单路径
    if (publicPaths.some((p) => path === p || path.startsWith(`${p}/`))) {
        return
    }

    // API Auth routes are public
    if (path.startsWith('/api/auth')) {
        return
    }

    // Allow public access to GET /api/posts and POST /api/posts/:id/comments
    if (path.startsWith('/api/posts')) {
        if (event.method === 'GET') {
            return
        }
        if (event.method === 'POST' && path.endsWith('/comments')) {
            return
        }
        if (event.method === 'POST' && path.endsWith('/verify-password')) {
            return
        }
        if (event.method === 'POST' && path.endsWith('/views')) {
            return
        }
    }

    // Allow public access to GET /api/categories and GET /api/tags
    if (path.startsWith('/api/categories') || path.startsWith('/api/tags')) {
        if (event.method === 'GET') {
            return
        }
    }

    // Allow public access to GET /api/search
    if (path.startsWith('/api/search')) {
        if (event.method === 'GET') {
            return
        }
    }

    // 外部 API 路径不需要 session 验证
    if (path.startsWith('/api/external')) {
        return
    }

    // 订阅接口不需要 session 验证
    if (path === '/api/subscribe') {
        return
    }

    // 主题设置接口不需要 session 验证
    if (path === '/api/settings/theme' && event.method === 'GET') {
        return
    }

    // 仅拦截 API 请求
    if (path.startsWith('/api')) {
        if (!session) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized',
            })
        }
    }
})
