import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { getLocaleRegistryItem, isSeoReadyLocale, resolveAppLocaleCode } from '@/i18n/config/locale-registry'
import {
    buildAbsoluteUrl,
    buildBlogPostingStructuredData,
    buildCollectionPageStructuredData,
    buildWebsiteStructuredData,
    resolveSeoImageUrl,
} from '@/utils/shared/seo'

type StructuredDataNode = Record<string, unknown>

export interface UsePageSeoOptions {
    type: 'website' | 'article' | 'collection'
    title: MaybeRefOrGetter<string>
    description?: MaybeRefOrGetter<string | null | undefined>
    path?: MaybeRefOrGetter<string | null | undefined>
    image?: MaybeRefOrGetter<string | null | undefined>
    noindex?: MaybeRefOrGetter<boolean | null | undefined>
    publishedAt?: MaybeRefOrGetter<string | Date | null | undefined>
    updatedAt?: MaybeRefOrGetter<string | Date | null | undefined>
    section?: MaybeRefOrGetter<string | null | undefined>
    tags?: MaybeRefOrGetter<string[] | null | undefined>
    authorName?: MaybeRefOrGetter<string | null | undefined>
    structuredData?: MaybeRefOrGetter<StructuredDataNode | StructuredDataNode[] | null | undefined>
}

function normalizeStructuredData(value: StructuredDataNode | StructuredDataNode[] | null | undefined): StructuredDataNode[] {
    if (!value) {
        return []
    }

    return (Array.isArray(value) ? value : [value]).filter(Boolean)
}

function buildDefaultStructuredData(
    type: UsePageSeoOptions['type'],
    payload: {
        canonicalUrl: string
        siteUrl: string
        metaTitle: string
        metaDescription: string
        languageTag: string
        siteName: string
        imageUrl: string | null
        authorName?: string | null
        publishedAt?: string | Date | null
        updatedAt?: string | Date | null
        section?: string | null
        tags?: string[]
    },
): StructuredDataNode {
    if (type === 'article') {
        return buildBlogPostingStructuredData({
            url: payload.canonicalUrl,
            siteUrl: payload.siteUrl,
            headline: payload.metaTitle,
            description: payload.metaDescription,
            inLanguage: payload.languageTag,
            publisherName: payload.siteName,
            authorName: payload.authorName,
            image: payload.imageUrl,
            publishedAt: payload.publishedAt,
            updatedAt: payload.updatedAt,
            section: payload.section,
            tags: payload.tags,
        })
    }

    if (type === 'collection') {
        return buildCollectionPageStructuredData({
            url: payload.canonicalUrl,
            siteUrl: payload.siteUrl,
            name: payload.metaTitle,
            description: payload.metaDescription,
            inLanguage: payload.languageTag,
        })
    }

    return buildWebsiteStructuredData({
        url: payload.canonicalUrl,
        siteUrl: payload.siteUrl,
        name: payload.siteName,
        description: payload.metaDescription,
        inLanguage: payload.languageTag,
        image: payload.imageUrl,
    })
}

export function usePageSeo(options: UsePageSeoOptions) {
    const route = useRoute()
    const runtimeConfig = useRuntimeConfig()
    const { locale, t } = useI18n()
    const { currentTitle, currentDescription, siteLogo } = useMomeiConfig()

    const siteUrl = computed(() => runtimeConfig.public.siteUrl || 'https://momei.app')
    const resolvedLocale = computed(() => resolveAppLocaleCode(locale.value))
    const localeRegistryItem = computed(() => getLocaleRegistryItem(resolvedLocale.value))
    const siteName = computed(() => currentTitle.value || t('app.name'))
    const fallbackDescription = computed(() => currentDescription.value || t('app.description'))
    const canonicalPath = computed(() => {
        const explicitPath = toValue(options.path)
        if (explicitPath) {
            return explicitPath
        }

        return route.fullPath.split('#')[0] || '/'
    })
    const canonicalUrl = computed(() => buildAbsoluteUrl(siteUrl.value, canonicalPath.value))
    const metaTitle = computed(() => toValue(options.title))
    const metaDescription = computed(() => toValue(options.description) || fallbackDescription.value)
    const imageUrl = computed(() => resolveSeoImageUrl(siteUrl.value, toValue(options.image) || siteLogo.value || null))
    const shouldNoIndex = computed(() => !isSeoReadyLocale(resolvedLocale.value) || Boolean(toValue(options.noindex)))
    const metaTags = computed(() => (toValue(options.tags) || []).filter(Boolean))
    const structuredDataNodes = computed<StructuredDataNode[]>(() => {
        if (shouldNoIndex.value) {
            return []
        }

        const defaultNode = buildDefaultStructuredData(options.type, {
            canonicalUrl: canonicalUrl.value,
            siteUrl: siteUrl.value,
            metaTitle: metaTitle.value,
            metaDescription: metaDescription.value,
            languageTag: localeRegistryItem.value.languageTag,
            siteName: siteName.value,
            imageUrl: imageUrl.value,
            authorName: toValue(options.authorName),
            publishedAt: toValue(options.publishedAt),
            updatedAt: toValue(options.updatedAt),
            section: toValue(options.section),
            tags: metaTags.value,
        })

        return [defaultNode, ...normalizeStructuredData(toValue(options.structuredData))]
    })

    useHead(() => {
        const meta: Record<string, string>[] = [
            { name: 'description', content: metaDescription.value },
            { name: 'robots', content: shouldNoIndex.value ? 'noindex, nofollow' : 'index, follow' },
            { property: 'og:title', content: metaTitle.value },
            { property: 'og:description', content: metaDescription.value },
            { property: 'og:url', content: canonicalUrl.value },
            { property: 'og:site_name', content: siteName.value },
            { property: 'og:type', content: options.type === 'article' ? 'article' : 'website' },
            { property: 'og:locale', content: localeRegistryItem.value.ogLocale },
            { name: 'twitter:card', content: imageUrl.value ? 'summary_large_image' : 'summary' },
            { name: 'twitter:title', content: metaTitle.value },
            { name: 'twitter:description', content: metaDescription.value },
        ]

        if (imageUrl.value) {
            meta.push(
                { property: 'og:image', content: imageUrl.value },
                { name: 'twitter:image', content: imageUrl.value },
            )
        }

        localeRegistryItem.value.ogAlternateLocales.forEach((alternateLocale) => {
            meta.push({ property: 'og:locale:alternate', content: alternateLocale })
        })

        if (options.type === 'article') {
            const publishedAt = toValue(options.publishedAt)
            const updatedAt = toValue(options.updatedAt)
            const section = toValue(options.section)

            if (publishedAt) {
                meta.push({ property: 'article:published_time', content: new Date(publishedAt).toISOString() })
            }

            if (updatedAt) {
                meta.push({ property: 'article:modified_time', content: new Date(updatedAt).toISOString() })
            }

            if (section) {
                meta.push({ property: 'article:section', content: section })
            }

            metaTags.value.forEach((tag) => {
                meta.push({ property: 'article:tag', content: tag })
            })
        }

        return {
            title: metaTitle.value,
            meta,
            script: structuredDataNodes.value.map((node, index) => ({
                key: `structured-data-${options.type}-${index}`,
                type: 'application/ld+json',
                children: JSON.stringify(node),
            })),
        }
    })

    return {
        canonicalUrl,
        imageUrl,
        shouldNoIndex,
    }
}
