import {
    APP_ENABLED_LOCALES,
    getLocaleRegistryItem,
    getLocaleRoutePrefix,
    isSeoReadyLocale,
    resolveAppLocaleCode,
} from '@/i18n/config/locale-registry'
import { buildAbsoluteUrl } from '@/utils/shared/seo'

export interface LocalizedSitemapItem {
    id: string
    slug: string
    language: string
    translationId: string | null
    updatedAt?: Date
}

export interface SitemapAlternative {
    hreflang: string
    href: string
}

export interface SitemapEntry {
    loc: string
    lastmod?: Date
    alternatives?: SitemapAlternative[]
}

export interface StaticSitemapPage {
    path: string
    lastmod?: Date
}

function resolveEntryPath(language: string, path: string): string {
    return `${getLocaleRoutePrefix(language)}${path}` || '/'
}

export function buildStaticSitemapEntries(
    pages: StaticSitemapPage[],
    baseUrl: string,
): SitemapEntry[] {
    const locales = APP_ENABLED_LOCALES.filter((locale) => isSeoReadyLocale(locale.code))

    return pages.flatMap((page) => {
        const alternatives = locales.map((locale) => ({
            hreflang: locale.languageTag,
            href: buildAbsoluteUrl(baseUrl, resolveEntryPath(locale.code, page.path)),
        }))

        return locales.map((locale) => ({
            loc: buildAbsoluteUrl(baseUrl, resolveEntryPath(locale.code, page.path)),
            lastmod: page.lastmod,
            alternatives,
        }))
    })
}

export function buildLocalizedSitemapEntries<T extends LocalizedSitemapItem>(
    items: T[],
    baseUrl: string,
    createPath: (item: T) => string,
): SitemapEntry[] {
    const eligibleItems = items.filter((item) => isSeoReadyLocale(item.language))
    const groups = new Map<string, T[]>()

    eligibleItems.forEach((item) => {
        const key = item.translationId || `${resolveAppLocaleCode(item.language)}:${item.id}`
        const group = groups.get(key) || []
        group.push(item)
        groups.set(key, group)
    })

    return eligibleItems.map((item) => {
        const key = item.translationId || `${resolveAppLocaleCode(item.language)}:${item.id}`
        const localizedGroup = groups.get(key) || [item]
        const alternatives = localizedGroup.length > 1
            ? localizedGroup.map((translation) => ({
                hreflang: getLocaleRegistryItem(translation.language).languageTag,
                href: buildAbsoluteUrl(baseUrl, resolveEntryPath(translation.language, createPath(translation))),
            }))
            : undefined

        return {
            loc: buildAbsoluteUrl(baseUrl, resolveEntryPath(item.language, createPath(item))),
            lastmod: item.updatedAt,
            alternatives,
        }
    })
}
