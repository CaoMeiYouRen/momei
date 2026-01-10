export interface ApiResponse<T = any> {
    code: number
    data?: T
    message?: string
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
        },
    })
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
