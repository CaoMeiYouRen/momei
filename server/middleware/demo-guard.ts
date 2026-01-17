import { defineEventHandler, createError } from 'h3'

export default defineEventHandler((event) => {
    const config = useRuntimeConfig()

    // 仅在演示模式下运行拦截逻辑
    if (config.public.demoMode === true) {
        const method = event.method
        const url = event.path

        // 如果是 GET 请求，或者是必须要放行的请求（如登录），则无需拦截
        if (method === 'GET' || url.startsWith('/api/auth') || url.startsWith('/api/posts')) {
            return
        }

        // 拦截所有敏感的管理 API
        const sensitivePatterns = [
            '/api/settings',
            '/api/admin/users/delete',
            '/api/admin/system',
            '/api/admin/logs',
        ]

        if (sensitivePatterns.some((pattern) => url.includes(pattern))) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden in Demo Mode',
                message: '对于系统安全性关键操作在演示模式下已被禁用。您可以尝试发布文章、修改分类等日常业务操作。',
            })
        }
    }
})
