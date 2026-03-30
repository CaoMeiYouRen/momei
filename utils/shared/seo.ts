import { buildAbsoluteUrl, isAbsoluteHttpUrl } from './url'

export interface WebsiteStructuredDataOptions {
    url: string
    siteUrl: string
    name: string
    description: string
    inLanguage: string
    image?: string | null
}

export interface CollectionPageStructuredDataOptions {
    url: string
    siteUrl: string
    name: string
    description: string
    inLanguage: string
}

export interface BlogPostingStructuredDataOptions {
    url: string
    siteUrl: string
    headline: string
    description: string
    inLanguage: string
    publisherName: string
    authorName?: string | null
    image?: string | null
    publishedAt?: string | Date | null
    updatedAt?: string | Date | null
    section?: string | null
    tags?: string[]
}

function normalizeDate(value?: string | Date | null): string | undefined {
    if (!value) {
        return undefined
    }

    const parsed = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(parsed.getTime())) {
        return undefined
    }

    return parsed.toISOString()
}

export { buildAbsoluteUrl } from './url'

export function resolveSeoImageUrl(baseUrl: string, image?: string | null): string | null {
    if (!image) {
        return null
    }

    if (isAbsoluteHttpUrl(image)) {
        return image
    }

    return buildAbsoluteUrl(baseUrl, image)
}

export function buildWebsiteStructuredData(options: WebsiteStructuredDataOptions): Record<string, unknown> {
    const image = options.image || undefined

    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${options.url}#website`,
        url: options.url,
        name: options.name,
        description: options.description,
        inLanguage: options.inLanguage,
        publisher: {
            '@type': 'Organization',
            name: options.name,
            url: options.siteUrl,
            ...(image ? { logo: image } : {}),
        },
        ...(image ? { image } : {}),
    }
}

export function buildCollectionPageStructuredData(options: CollectionPageStructuredDataOptions): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${options.url}#collection`,
        url: options.url,
        name: options.name,
        description: options.description,
        inLanguage: options.inLanguage,
        isPartOf: {
            '@type': 'WebSite',
            '@id': `${options.siteUrl}#website`,
            url: options.siteUrl,
            name: options.name,
        },
    }
}

export function buildBlogPostingStructuredData(options: BlogPostingStructuredDataOptions): Record<string, unknown> {
    const publishedAt = normalizeDate(options.publishedAt)
    const updatedAt = normalizeDate(options.updatedAt) || publishedAt
    const image = options.image || undefined
    const tags = options.tags?.filter(Boolean)

    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': `${options.url}#article`,
        mainEntityOfPage: options.url,
        url: options.url,
        headline: options.headline,
        description: options.description,
        inLanguage: options.inLanguage,
        ...(publishedAt ? { datePublished: publishedAt } : {}),
        ...(updatedAt ? { dateModified: updatedAt } : {}),
        ...(image ? { image } : {}),
        ...(options.section ? { articleSection: options.section } : {}),
        ...(tags?.length ? { keywords: tags.join(', ') } : {}),
        author: {
            '@type': 'Person',
            name: options.authorName || options.publisherName,
        },
        publisher: {
            '@type': 'Organization',
            name: options.publisherName,
            url: options.siteUrl,
            ...(image ? { logo: image } : {}),
        },
    }
}
