import { z } from 'zod'

/**
 * 外部链接 API 的通用错误处理
 * 统一 POST 和 PUT 端点的错误响应格式
 */
export function handleExternalLinkError(error: unknown, fallbackMessage: string) {
    if (error instanceof z.ZodError) {
        return {
            code: 400,
            data: null,
            message: error.issues[0]?.message || 'Invalid request body',
        }
    }

    if (error instanceof Error && (error.message === 'Invalid URL' || error.message === 'URL is blacklisted')) {
        return {
            code: 400,
            data: null,
            message: error.message,
        }
    }

    return {
        code: 500,
        data: null,
        message: error instanceof Error ? error.message : fallbackMessage,
    }
}
