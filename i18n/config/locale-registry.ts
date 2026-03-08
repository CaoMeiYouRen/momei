import { getLocaleMessageFilePaths } from './locale-modules'

export type LocaleReadiness = 'draft' | 'ui-ready' | 'seo-ready'
export type AppLocaleCode = 'zh-CN' | 'en-US'

export interface LocaleRegistryItem {
    code: AppLocaleCode
    languageTag: string
    name: string
    nativeName: string
    isoName: string
    dir: 'ltr' | 'rtl'
    enabled: boolean
    default: boolean
    fallbackChain: AppLocaleCode[]
    routePrefix: string
    readiness: LocaleReadiness
    switchable: boolean
    indexable: boolean
    sitemapEnabled: boolean
    feedEnabled: boolean
    ogLocale: string
    ogAlternateLocales: string[]
}

export const APP_DEFAULT_LOCALE: AppLocaleCode = 'zh-CN'
export const APP_FALLBACK_LOCALE: AppLocaleCode = APP_DEFAULT_LOCALE

export const APP_LOCALE_REGISTRY = [
    {
        code: 'zh-CN',
        languageTag: 'zh-CN',
        name: '简体中文',
        nativeName: '简体中文',
        isoName: 'Chinese (Simplified)',
        dir: 'ltr',
        enabled: true,
        default: true,
        fallbackChain: ['zh-CN'],
        routePrefix: '',
        readiness: 'seo-ready',
        switchable: true,
        indexable: true,
        sitemapEnabled: true,
        feedEnabled: true,
        ogLocale: 'zh_CN',
        ogAlternateLocales: ['en_US'],
    },
    {
        code: 'en-US',
        languageTag: 'en-US',
        name: 'English',
        nativeName: 'English',
        isoName: 'English (United States)',
        dir: 'ltr',
        enabled: true,
        default: false,
        fallbackChain: ['en-US', 'zh-CN'],
        routePrefix: '/en-US',
        readiness: 'seo-ready',
        switchable: true,
        indexable: true,
        sitemapEnabled: true,
        feedEnabled: true,
        ogLocale: 'en_US',
        ogAlternateLocales: ['zh_CN'],
    },
] as const satisfies readonly LocaleRegistryItem[]

export const APP_ENABLED_LOCALES = APP_LOCALE_REGISTRY.filter((locale) => locale.enabled)
export const APP_LOCALE_CODES = APP_ENABLED_LOCALES.map((locale) => locale.code) as AppLocaleCode[]

const APP_LOCALE_ALIAS_MAP: Record<string, AppLocaleCode> = {
    zh: 'zh-CN',
    'zh-cn': 'zh-CN',
    'zh-hans': 'zh-CN',
    'zh-hant': 'zh-CN',
    en: 'en-US',
    'en-us': 'en-US',
    default: APP_DEFAULT_LOCALE,
}

export const NUXT_I18N_LOCALES = APP_ENABLED_LOCALES.map((locale) => ({
    code: locale.code,
    language: locale.languageTag,
    name: locale.name,
    dir: locale.dir,
    files: getLocaleMessageFilePaths(locale.code),
}))

export function isAppLocale(locale: string): locale is AppLocaleCode {
    return APP_LOCALE_CODES.includes(locale as AppLocaleCode)
}

export function resolveAppLocaleCode(locale?: string | null): AppLocaleCode {
    if (!locale) {
        return APP_DEFAULT_LOCALE
    }

    if (isAppLocale(locale)) {
        return locale
    }

    const normalizedLocale = locale.trim().toLowerCase()
    return APP_LOCALE_ALIAS_MAP[normalizedLocale] || APP_FALLBACK_LOCALE
}

export function getLocaleRegistryItem(locale?: string | null): LocaleRegistryItem {
    const resolvedLocale = resolveAppLocaleCode(locale)
    return APP_LOCALE_REGISTRY.find((item) => item.code === resolvedLocale) || APP_LOCALE_REGISTRY[0]
}

export function getLocaleRoutePrefix(locale?: string | null): string {
    return getLocaleRegistryItem(locale).routePrefix
}

export function isSeoReadyLocale(locale?: string | null): boolean {
    const item = getLocaleRegistryItem(locale)
    return item.readiness === 'seo-ready' && item.indexable
}
