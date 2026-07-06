/**
 * 杂项工具函数整合
 *
 * 包含以下单函数文件的功能：
 * - stable-serialize.ts
 * - json-clone.ts
 * - markdown-heading.ts
 * - route-path.ts
 */

/**
 * 稳定序列化：将值转换为稳定的 JSON 字符串（对象键排序）
 */
export function stableSerialize(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map((item) => stableSerialize(item)).join(',')}]`
    }

    if (value && typeof value === 'object') {
        return `{${sortObjectEntries(value as Record<string, unknown>)
            .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`)
            .join(',')}}`
    }

    return JSON.stringify(value)
}

function sortObjectEntries(value: Record<string, unknown>) {
    return Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
}

/**
 * JSON 克隆：深拷贝 JSON 兼容的值
 */
export const cloneJsonValue = <T>(value: T): T => {
    if (value === null || value === undefined) {
        return value
    }

    return JSON.parse(JSON.stringify(value)) as T
}

/**
 * Markdown 标题 slug 生成
 */
export function slugifyMarkdownHeading(value: string) {
    return value.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')
}

/**
 * 路由路径标准化：移除 locale 前缀，确保以 / 开头，不以 / 结尾
 */
export function normalizeRoutePath(path: string, localeCodes: readonly string[]) {
    if (!path) {
        return '/'
    }

    const normalizedSource = path.startsWith('/') ? path : `/${path}`
    const segments = normalizedSource.split('/')
    const firstSegment = segments[1]
    const strippedLocalePath = firstSegment && localeCodes.includes(firstSegment)
        ? `/${segments.slice(2).join('/')}`
        : normalizedSource

    if (!strippedLocalePath || strippedLocalePath === '//') {
        return '/'
    }

    if (strippedLocalePath.length > 1 && strippedLocalePath.endsWith('/')) {
        return strippedLocalePath.slice(0, -1)
    }

    return strippedLocalePath
}
