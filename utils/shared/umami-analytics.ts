export interface UmamiAnalyticsOptions {
    websiteId: string
    scriptUrl: string
}

export const DEFAULT_UMAMI_SCRIPT_URL = 'https://analytics.umami.is/script.js'

export function parseUmamiAnalyticsOptions(rawValue: unknown): UmamiAnalyticsOptions | null {
    if (typeof rawValue !== 'string') {
        return null
    }

    const trimmedRawValue = rawValue.trim()
    if (!trimmedRawValue) {
        return null
    }

    let parsed: Record<string, unknown>
    try {
        parsed = JSON.parse(trimmedRawValue) as Record<string, unknown>
    } catch {
        // 非 JSON 字符串(如意外写入的脏数据)不视为有效配置，拒绝注入
        return null
    }

    const websiteId = typeof parsed.websiteId === 'string' ? parsed.websiteId.trim() : ''
    if (!websiteId) {
        return null
    }

    const scriptUrl = typeof parsed.scriptUrl === 'string' ? parsed.scriptUrl.trim() : ''

    return {
        websiteId,
        scriptUrl: scriptUrl || DEFAULT_UMAMI_SCRIPT_URL,
    }
}

export function stringifyUmamiAnalyticsOptions(options: {
    websiteId?: string | null
    scriptUrl?: string | null
}): string {
    const websiteId = (options.websiteId || '').trim()
    const scriptUrl = (options.scriptUrl || '').trim()

    if (!websiteId) {
        return ''
    }

    return JSON.stringify({
        websiteId,
        scriptUrl: scriptUrl || DEFAULT_UMAMI_SCRIPT_URL,
    })
}
