import { defineEventHandler, createError } from 'h3'

export default defineEventHandler((event) => {
    const config = useRuntimeConfig()

    // 仅在演示模式下运行拦截逻辑
    if (config.public.demoMode === true) {
        const method = event.method
        const url = event.path

        // 1. 放行所有 GET 请求
        if (method === 'GET') {
            return
        }

        // 2. 拦截所有 DELETE 请求 (防止演示数据被清空)
        if (method === 'DELETE') {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden in Demo Mode',
                message: '演示模式下禁止删除文章或分类，以保证其他用户的体验。系统会定期重置数据。',
            })
        }

        // 3. 拦截绝对敏感的账号与核心设置管理 API (基于实际 API 路径)
        const sensitivePatterns = [
            '/api/auth/admin', // Better Auth 管理插件
            '/api/user/api-keys', // API 密钥管理
            '/api/auth/update-user', // 用户资料更新 (包含密码修改)
            '/api/auth/change-password',
            '/api/auth/delete-user',
        ]

        if (sensitivePatterns.some((pattern) => url.startsWith(pattern))) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden in Demo Mode',
                message: '此核心管理操作在演示模式下已被禁用。您可以尝试发布文章、翻译内容等协同功能。',
            })
        }
    }
})
