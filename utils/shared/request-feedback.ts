import { isRecord } from '@/utils/shared/is-record'

/**
 * 请求错误的通用结构。兼容 `ofetch` 抛出的 `FetchError` 与
 * H3 / Nitro 服务端 `createError` 返回的响应体格式。
 *
 * - `statusCode` / `statusMessage` → HTTP 层状态信息
 * - `message` → 错误描述（可能是用户可读的提示）
 * - `data` → 服务端响应体（可能包含 `i18nKey`、`code`、`message` 等
 *   供客户端决策的字段）
 */
export interface RequestFeedbackError {
    statusCode?: number
    statusMessage?: string
    message?: string
    data?: unknown
}

/**
 * 错误消息解析选项。
 *
 * - `fallbackKey` → 所有解析路径均失败时的兜底翻译键（必填）
 * - `statusKeyMap` → 按 HTTP 状态码映射到 i18n 键（可选）
 * - `codeKeyMap` → 按服务端业务 code 映射到 i18n 键（可选）
 */
export interface RequestFeedbackOptions {
    fallbackKey: string
    statusKeyMap?: Partial<Record<number, string>>
    codeKeyMap?: Record<string, string>
}

/**
 * Zod / H3 校验失败时返回的单个校验问题。
 * `path` 是出错的字段路径（如 `['email']` 或 `['profile', 'name']`）。
 */
export interface ValidationIssue {
    path: (string | number)[]
    message: string
}

/**
 * 类型守卫：判断一个值是否满足 `ValidationIssue` 结构。
 * 要求 `path` 为数组且 `message` 为字符串。
 */
const isValidationIssue = (value: unknown): value is ValidationIssue => {
    if (!isRecord(value)) {
        return false
    }

    return Array.isArray(value.path) && typeof value.message === 'string'
}

/**
 * 从请求错误对象中提取校验问题列表，兼容两种常见的服务端返回格式：
 * 1. `data` 直接是 `ValidationIssue[]`（如 Zod 校验失败）
 * 2. `data.data` 是 `ValidationIssue[]`（如某些框架的嵌套包装）
 *
 * @returns 校验问题数组；无数据时返回空数组
 */
export function extractValidationIssues(error: unknown): ValidationIssue[] {
    const candidate = error as RequestFeedbackError | null | undefined
    const data = candidate?.data

    // 1. 平铺式：data 直接是数组
    if (Array.isArray(data)) {
        return data.filter(isValidationIssue)
    }

    // 2. 嵌套式：data.data 是数组（H3 常见格式）
    if (isRecord(data) && Array.isArray(data.data)) {
        return data.data.filter(isValidationIssue)
    }

    return []
}

/**
 * 将校验问题数组转换成以字段名为键的错误映射，用于表单级错误展示。
 *
 * - 只取 `path[0]` 作为字段名（忽略嵌套子路径）
 * - 同字段多项错误只保留第一条
 * - 数字路径（如 `[0]`）被忽略，不进入映射
 *
 * @returns `{ fieldName: errorMessage }` 的局部映射
 */
export function mapValidationIssues<Field extends string>(issues: ValidationIssue[]): Partial<Record<Field, string>> {
    const errors: Partial<Record<Field, string>> = {}

    issues.forEach((issue) => {
        const field = issue.path[0]
        // 只保留字符串路径，且每字段仅保留第一条错误
        if (typeof field === 'string' && !errors[field as Field]) {
            errors[field as Field] = issue.message
        }
    })

    return errors
}

/**
 * 从请求错误对象中按优先级提取用户可读的错误消息。
 *
 * **解析链（按优先级）:**
 * 1. `data.i18nKey` → 服务端指定的翻译键 → `translate(key)`
 * 2. `data.code` → 业务错误码 → 查 `options.codeKeyMap` → `translate(mappedKey)`
 * 3. `statusCode` → HTTP 状态码 → 查 `options.statusKeyMap` → `translate(mappedKey)`
 * 4. `data.message` → 服务端返回的原始错误文本（如 `createError` 的
 *    message）→ 直接返回原文，不做翻译
 * 5. `options.fallbackKey` → 所有路径均失败时的兜底翻译键
 *
 * 第 4 步是最后的安全网——当服务端提供了有意义的错误描述但未附带
 * i18nKey / code 时，不再将其丢弃，而是直接展示给用户。
 */
export function resolveRequestErrorMessage(
    error: unknown,
    options: RequestFeedbackOptions,
    translate: (key: string) => string,
) {
    const candidate = error as RequestFeedbackError | null | undefined

    // 1. 服务端指定了 i18n 翻译键（最高优先级）
    if (isRecord(candidate?.data) && typeof candidate.data.i18nKey === 'string') {
        return translate(candidate.data.i18nKey)
    }

    // 2. 服务端返回了业务错误码 → 查 code → i18n 映射
    if (isRecord(candidate?.data)) {
        const code = candidate.data.code
        const normalizedCode = typeof code === 'string' || typeof code === 'number'
            ? String(code)
            : null
        const mappedKey = normalizedCode ? options.codeKeyMap?.[normalizedCode] : undefined
        if (mappedKey) {
            return translate(mappedKey)
        }
    }

    // 3. HTTP 状态码 → 查状态码 → i18n 映射
    if (candidate?.statusCode !== undefined) {
        const mappedKey = options.statusKeyMap?.[candidate.statusCode]
        if (mappedKey) {
            return translate(mappedKey)
        }
    }

    // 4. 服务端返回了人类可读的错误消息 → 直接展示，不做翻译
    if (isRecord(candidate?.data) && typeof candidate.data.message === 'string' && candidate.data.message.trim()) {
        return candidate.data.message.trim()
    }

    // 5. 兜底：翻译键 fallback
    return translate(options.fallbackKey)
}
