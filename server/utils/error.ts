import { t, getLocale } from './i18n'

/**
 * 自定义 API 错误类
 * 支持 i18n key 以及可选参数替换
 */
export class APIError extends Error {
    constructor(
        public key: string,
        public statusCode: number = 400,
        public params?: Record<string, any>,
    ) {
        super(key)
        // 确保实例化的名称正确
        this.name = 'APIError'
    }
}

/**
 * 构建并抛出 H3 兼容的错误
 * 可以在之后通过统一的 Error Handler 捕捉或在此处立即生成 Localized Response
 * @param key 翻译键，例如 'error.unauthorized'
 * @param statusCode HTTP 状态码
 * @param params 翻译替换参数
 */
export async function throwLocalizedError(key: string, statusCode: number = 400, params?: Record<string, any>) {
    const message = await t(key, params)
    const locale = getLocale()

    throw createError({
        statusCode,
        statusMessage: message,
        data: {
            code: statusCode, // 业务状态码 (若有特殊的也可在此自定义)
            message,
            locale,
            key, // 保留原始 Key 供前端排错或特殊处理
        },
    })
}

// 常用语义化错误定义（由于 t 是异步的，只能通过包装成返回 APIError 的工厂函数）
export const Errors = {
    UNAUTHORIZED: (params?: Record<string, any>) => new APIError('error.unauthorized', 401, params),
    FORBIDDEN: (params?: Record<string, any>) => new APIError('error.forbidden', 403, params),
    NOT_FOUND: (resource: string) => new APIError('error.notFound', 404, { resource }),
    VALIDATION_FAILED: (field: string) => new APIError('error.validation', 400, { field }),
    RATE_LIMITED: (params?: Record<string, any>) => new APIError('error.rateLimited', 429, params),
}

/**
 * 助手工具：将普通 Error 或 APIError 转化为 LocalizedResponse (H3Event 拦截器中更常用)
 * 此处作为通用组件抽取
 */
export async function createLocalizedResponse(error: any) {
    const locale = getLocale()
    let statusCode = error.statusCode || 500
    let messageKey = 'error.internal'
    let params: Record<string, any> = {}

    if (error instanceof APIError) {
        statusCode = error.statusCode
        messageKey = error.key
        params = error.params || {}
    } else if (error.data?.key) {
        // 如果是已被处理过的带 key 的 error
        messageKey = error.data.key
        params = error.data.params || {}
    }

    const message = await t(messageKey, params)

    return {
        code: statusCode,
        message,
        locale,
        data: null,
    }
}
