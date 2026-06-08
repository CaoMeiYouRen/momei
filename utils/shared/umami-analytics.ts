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

    try {
        const parsed = JSON.parse(trimmedRawValue) as Record<string, unknown>
        const websiteId = typeof parsed.websiteId === 'string' ? parsed.websiteId.trim() : ''
        const scriptUrl = typeof parsed.scriptUrl === 'string' ? parsed.scriptUrl.trim() : ''

        if (!websiteId) {
            return null
        }

        return {
            websiteId,
            scriptUrl: scriptUrl || DEFAULT_UMAMI_SCRIPT_URL,
        }
    } catch {
        return {
            websiteId: trimmedRawValue,
            scriptUrl: DEFAULT_UMAMI_SCRIPT_URL,
        }
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
