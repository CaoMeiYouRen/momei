import { H3Event } from 'h3'

/**
 * 获取必填的路由参数
 * @param event H3 事件
 * @param name 参数名
 */
export function getRequiredRouterParam(event: H3Event, name: string): string {
    const value = getRouterParam(event, name)
    if (!value) {
        throw createError({
            statusCode: 400,
            statusMessage: `${name.toUpperCase()} is required`,
            data: {
                code: 400,
                message: `${name.toUpperCase()} is required`,
            },
        })
    }
    return value
}
