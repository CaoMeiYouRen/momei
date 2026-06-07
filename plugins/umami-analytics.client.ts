interface UmamiAnalyticsOptions {
    websiteId: string
    scriptUrl: string
}

const DEFAULT_UMAMI_SCRIPT_URL = 'https://analytics.umami.is/script.js'

function resolveUmamiAnalyticsOptions(rawValue: unknown): UmamiAnalyticsOptions | null {
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

export default defineNuxtPlugin(() => {
    if (!import.meta.client) {
        return
    }

    const config = useRuntimeConfig()
    const siteConfig = useState<Record<string, unknown>>('siteConfig', () => ({}))
    const hasInjected = useState<boolean>('umami-analytics-injected', () => false)

    const injectScript = (rawValue: unknown) => {
        if (hasInjected.value) {
            return
        }

        const options = resolveUmamiAnalyticsOptions(rawValue)
        if (!options) {
            return
        }

        const existingScript = document.querySelector<HTMLScriptElement>(
            `script[src="${options.scriptUrl}"][data-website-id="${options.websiteId}"]`,
        )
        if (existingScript) {
            hasInjected.value = true
            return
        }

        const script = document.createElement('script')
        script.src = options.scriptUrl
        script.async = true
        script.defer = true
        script.setAttribute('data-website-id', options.websiteId)
        document.head.appendChild(script)
        hasInjected.value = true
    }

    injectScript(config.public.umamiAnalytics)

    watch(
        () => siteConfig.value.umamiAnalytics,
        (value) => {
            injectScript(value)
        },
        { immediate: true },
    )
})
