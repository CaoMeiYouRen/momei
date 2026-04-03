export type ExternalFeedProvider = 'rss' | 'rsshub'

export type ExternalFeedLocaleStrategy = 'inherit-current' | 'fixed' | 'all'

export interface ExternalFeedSourceConfig {
    id: string
    enabled: boolean
    provider: ExternalFeedProvider
    title: string
    sourceUrl: string
    siteUrl: string | null
    siteName: string | null
    defaultLocale: string | null
    localeStrategy: ExternalFeedLocaleStrategy
    includeInHome: boolean
    badgeLabel: string | null
    priority: number
    timeoutMs: number | null
    cacheTtlSeconds: number | null
    staleWhileErrorSeconds: number | null
    maxItems: number | null
}

export interface ExternalFeedItem {
    id: string
    sourceId: string
    title: string
    summary: string | null
    url: string
    canonicalUrl: string
    publishedAt: string | null
    authorName: string | null
    language: string | null
    coverImage: string | null
    sourceTitle: string
    sourceSiteUrl: string | null
    sourceBadge: string | null
    dedupeKey: string
    priority: number
}

export interface ExternalFeedSnapshot {
    sourceId: string
    localeBucket: string
    fetchedAt: string
    expiresAt: string
    staleUntil: string
    items: ExternalFeedItem[]
}

export interface ExternalFeedHomePayload {
    items: ExternalFeedItem[]
    degraded: boolean
    stale: boolean
    fetchedAt: string | null
    sourceCount: number
}
