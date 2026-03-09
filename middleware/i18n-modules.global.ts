import { ensureRouteLocaleMessages } from '@/i18n/config/locale-runtime-loader'
import { APP_DEFAULT_LOCALE, resolveAppLocaleCode } from '@/i18n/config/locale-registry'

function resolveCurrentLocale(i18n: unknown): string {
    if (!i18n || typeof i18n !== 'object') {
        return APP_DEFAULT_LOCALE
    }

    const locale = (i18n as { locale?: string | { value?: string }, global?: { locale?: string | { value?: string } } }).locale
        ?? (i18n as { global?: { locale?: string | { value?: string } } }).global?.locale

    if (typeof locale === 'string') {
        return resolveAppLocaleCode(locale)
    }

    if (locale && typeof locale === 'object' && typeof locale.value === 'string') {
        return resolveAppLocaleCode(locale.value)
    }

    return APP_DEFAULT_LOCALE
}

export default defineNuxtRouteMiddleware(async (to) => {
    const nuxtApp = useNuxtApp()
    const runtimeConfig = useRuntimeConfig()

    await ensureRouteLocaleMessages({
        i18n: nuxtApp.$i18n as object,
        locale: resolveCurrentLocale(nuxtApp.$i18n),
        path: to.path,
        demoMode: runtimeConfig.public.demoMode,
    })
})
