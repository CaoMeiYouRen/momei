/**
 * 从 unknown error 中提取人类可读的错误消息。
 * 优先使用 `Error.message`，否则转为字符串。
 */
export function toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}
