/**
 * 从 API 错误响应中提取可读的详细信息
 * 兼容 ofetch / $fetch 的各种错误形状
 */
export function getErrorDetail(error: unknown, fallback: string): string {
    const candidate = error as {
        data?: { message?: string, statusMessage?: string }
        statusMessage?: string
        message?: string
    }

    return candidate?.data?.message
        || candidate?.data?.statusMessage
        || candidate?.statusMessage
        || candidate?.message
        || fallback
}
