import { parseUmamiAnalyticsOptions } from '@/utils/shared/umami-analytics'

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

        const options = parseUmamiAnalyticsOptions(rawValue)
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
