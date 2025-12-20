import { auth } from '@/lib/auth'
import { publicPaths } from '@/utils/shared/public-paths'
import logger from '@/server/utils/logger'

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
