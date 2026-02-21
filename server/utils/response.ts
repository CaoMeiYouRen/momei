import { t, getLocale } from './i18n'

export interface ApiResponse<T = any> {
    code: number
    data?: T
    message?: string
    locale?: string
}

/**
 * 成功响应
 * @param data 响应数据
 * @param code 状态码，默认为 200
 */
export function success<T>(data: T, code = 200): ApiResponse<T> {
    return {
        code,
        data,
        locale: getLocale(),
    }
}

/**
 * 带翻译支持的成功响应
 */
export async function localizedSuccess<T>(data: T, messageKey: string, params?: Record<string, any>, code = 200): Promise<ApiResponse<T>> {
    const locale = getLocale()
    const message = await t(messageKey, params)

    return {
        code,
        data,
        message,
        locale,
    }
}

/**
 * 失败响应（通常由 createError 抛出，这里提供一个工具函数用于构建错误对象）
 * @param message 错误消息
 * @param statusCode 状态码，默认为 400
 */
export function fail(message: string, statusCode = 400) {
    throw createError({
        statusCode,
        statusMessage: message,
        data: {
            code: statusCode,
            message,
            locale: getLocale(),
        },
    })
}

/**
 * 带翻译支持的失败响应
 */
export async function localizedFail(messageKey: string, statusCode = 400, params?: Record<string, any>) {
    const locale = getLocale()
    const message = await t(messageKey, params)

    throw createError({
        statusCode,
        statusMessage: message,
        data: {
            code: statusCode,
            message,
            locale,
            key: messageKey,
        },
    })
}

/**
 * 确保实体存在，否则抛出 404 错误
 * @param entity 实体对象
 * @param name 实体名称（用于错误消息）
 */
export function ensureFound<T>(entity: T | null | undefined, name: string): T {
    if (!entity) {
        throw createError({
            statusCode: 404,
            statusMessage: `${name} not found`,
            data: {
                flag: 'NOT_FOUND',
                code: 404,
                message: `${name} not found`,
                locale: getLocale(),
                params: { resource: name },
            },
        })
    }
    return entity
}

/**
 * 分页数据包装
 * @param items 数据列表
 * @param total 总数
 * @param page 当前页码
 * @param limit 每页数量
 */
export function paginate<T>(items: T[], total: number, page: number, limit: number) {
    return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    }
}
