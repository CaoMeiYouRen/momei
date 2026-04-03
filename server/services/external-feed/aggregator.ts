import { canUseStaleExternalFeedSnapshot, getExternalFeedSnapshot, isExternalFeedSnapshotFresh, setExternalFeedSnapshot } from './cache'
import { fetchExternalFeedSource } from './fetcher'
import { parseExternalFeedXml } from './parser'
import { getExternalFeedRegistryConfig, resolveExternalFeedLocaleBucket } from './registry'
import type { ExternalFeedHomePayload, ExternalFeedItem, ExternalFeedSnapshot, ExternalFeedSourceConfig } from '@/types/external-feed'
import { APP_LOCALE_CODES, resolveAppLocaleCode, type AppLocaleCode } from '@/i18n/config/locale-registry'
import logger from '@/server/utils/logger'

export interface ExternalFeedRefreshSummary {
    refreshedAt: string
    sourceCount: number
    snapshotCount: number
    failureCount: number
}

function normalizeItemLanguage(language: string | null) {
    return language ? resolveAppLocaleCode(language) : null
}

function shouldIncludeItemForLocale(item: ExternalFeedItem, source: ExternalFeedSourceConfig, locale: AppLocaleCode) {
    const itemLocale = normalizeItemLanguage(item.language)

    if (itemLocale) {
        return itemLocale === locale
    }

    if (source.localeStrategy === 'all') {
        return true
    }

    if (source.localeStrategy === 'fixed') {
        return (source.defaultLocale ?? locale) === locale
    }

    return true
}

function sortAndDedupeExternalFeedItems(items: ExternalFeedItem[]) {
    const dedupedItems = new Map<string, ExternalFeedItem>()

    for (const item of items) {
        const existingItem = dedupedItems.get(item.dedupeKey)
        if (!existingItem) {
            dedupedItems.set(item.dedupeKey, item)
            continue
        }

        const existingTime = existingItem.publishedAt ? new Date(existingItem.publishedAt).getTime() : 0
        const currentTime = item.publishedAt ? new Date(item.publishedAt).getTime() : 0

        if (currentTime > existingTime || (currentTime === existingTime && item.priority > existingItem.priority)) {
            dedupedItems.set(item.dedupeKey, item)
        }
    }

    return [...dedupedItems.values()].sort((left, right) => {
        const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0
        const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0

        if (leftTime !== rightTime) {
            return rightTime - leftTime
        }

        if (left.priority !== right.priority) {
            return right.priority - left.priority
        }

        return left.sourceId.localeCompare(right.sourceId)
    })
}

async function refreshExternalFeedSnapshot(
    source: ExternalFeedSourceConfig,
    localeBucket: string,
    cacheTtlSeconds: number,
    staleWhileErrorSeconds: number,
) {
    const xml = await fetchExternalFeedSource(source)
    const items = parseExternalFeedXml(xml, source).slice(0, source.maxItems ?? 10)
    const now = new Date()
    const snapshot: ExternalFeedSnapshot = {
        sourceId: source.id,
        localeBucket,
        fetchedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + cacheTtlSeconds * 1000).toISOString(),
        staleUntil: new Date(now.getTime() + staleWhileErrorSeconds * 1000).toISOString(),
        items,
    }

    await setExternalFeedSnapshot(snapshot)

    return {
        snapshot,
        stale: false,
    }
}

async function resolveExternalFeedSourceItems(
    source: ExternalFeedSourceConfig,
    locale: AppLocaleCode,
    defaultCacheTtlSeconds: number,
    defaultStaleWhileErrorSeconds: number,
) {
    const localeBucket = resolveExternalFeedLocaleBucket(source, locale)
    const cachedSnapshot = await getExternalFeedSnapshot(source.id, localeBucket)
    const now = new Date()

    if (cachedSnapshot && isExternalFeedSnapshotFresh(cachedSnapshot, now)) {
        return {
            snapshot: cachedSnapshot,
            stale: false,
            degraded: false,
        }
    }

    try {
        const refreshed = await refreshExternalFeedSnapshot(
            source,
            localeBucket,
            source.cacheTtlSeconds ?? defaultCacheTtlSeconds,
            source.staleWhileErrorSeconds ?? defaultStaleWhileErrorSeconds,
        )

        return {
            snapshot: refreshed.snapshot,
            stale: refreshed.stale,
            degraded: false,
        }
    } catch (error) {
        if (cachedSnapshot && canUseStaleExternalFeedSnapshot(cachedSnapshot, now)) {
            logger.warn('[external-feed] using stale snapshot', {
                sourceId: source.id,
                localeBucket,
                message: error instanceof Error ? error.message : 'Unknown refresh error',
            })

            return {
                snapshot: cachedSnapshot,
                stale: true,
                degraded: true,
            }
        }

        logger.warn('[external-feed] source refresh failed without snapshot', {
            sourceId: source.id,
            localeBucket,
            message: error instanceof Error ? error.message : 'Unknown refresh error',
        })

        return {
            snapshot: null,
            stale: false,
            degraded: true,
        }
    }
}

export async function getExternalFeedHomePayload(locale?: string | null): Promise<ExternalFeedHomePayload> {
    const resolvedLocale = resolveAppLocaleCode(locale)
    const registry = await getExternalFeedRegistryConfig()

    if (!registry.enabled || !registry.homeEnabled) {
        return {
            items: [],
            degraded: false,
            stale: false,
            fetchedAt: null,
            sourceCount: 0,
        }
    }

    const homeSources = registry.sources.filter((source) => source.includeInHome)
    const sourceResults = await Promise.all(homeSources.map(async (source) => {
        const result = await resolveExternalFeedSourceItems(
            source,
            resolvedLocale,
            registry.defaultCacheTtlSeconds,
            registry.defaultStaleWhileErrorSeconds,
        )

        const items = result.snapshot?.items.filter((item) => shouldIncludeItemForLocale(item, source, resolvedLocale)) ?? []

        return {
            ...result,
            items,
        }
    }))

    const mergedItems = sortAndDedupeExternalFeedItems(sourceResults.flatMap((result) => result.items)).slice(0, registry.homeLimit)
    const fetchedTimestamps = sourceResults.map((result) => result.snapshot?.fetchedAt).filter((value): value is string => Boolean(value))

    return {
        items: mergedItems,
        degraded: sourceResults.some((result) => result.degraded),
        stale: sourceResults.some((result) => result.stale),
        fetchedAt: fetchedTimestamps.sort().at(-1) ?? null,
        sourceCount: homeSources.length,
    }
}

export async function refreshExternalFeedCaches(locales: AppLocaleCode[] = APP_LOCALE_CODES): Promise<ExternalFeedRefreshSummary> {
    const registry = await getExternalFeedRegistryConfig()

    if (!registry.enabled || registry.sources.length === 0) {
        return {
            refreshedAt: new Date().toISOString(),
            sourceCount: registry.sources.length,
            snapshotCount: 0,
            failureCount: 0,
        }
    }

    const targets = new Map<string, { source: ExternalFeedSourceConfig, localeBucket: string }>()

    for (const source of registry.sources) {
        for (const locale of locales) {
            const localeBucket = resolveExternalFeedLocaleBucket(source, locale)
            targets.set(`${source.id}:${localeBucket}`, {
                source,
                localeBucket,
            })
        }
    }

    let snapshotCount = 0
    let failureCount = 0

    for (const target of targets.values()) {
        try {
            await refreshExternalFeedSnapshot(
                target.source,
                target.localeBucket,
                target.source.cacheTtlSeconds ?? registry.defaultCacheTtlSeconds,
                target.source.staleWhileErrorSeconds ?? registry.defaultStaleWhileErrorSeconds,
            )
            snapshotCount += 1
        } catch (error) {
            failureCount += 1
            logger.warn('[external-feed] manual refresh failed', {
                sourceId: target.source.id,
                localeBucket: target.localeBucket,
                message: error instanceof Error ? error.message : 'Unknown refresh error',
            })
        }
    }

    return {
        refreshedAt: new Date().toISOString(),
        sourceCount: registry.sources.length,
        snapshotCount,
        failureCount,
    }
}
