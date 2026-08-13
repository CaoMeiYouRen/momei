import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getExternalFeedHomePayload, refreshExternalFeedCaches } from '@/server/services/external-feed/aggregator'

vi.mock('@/server/services/external-feed/registry', () => ({
    getExternalFeedRegistryConfig: vi.fn(),
    resolveExternalFeedLocaleBucket: vi.fn((source, locale) => source.localeStrategy === 'all' ? 'all' : locale),
}))

vi.mock('@/server/services/external-feed/cache', () => ({
    getExternalFeedSnapshot: vi.fn(),
    isExternalFeedSnapshotFresh: vi.fn(() => false),
    canUseStaleExternalFeedSnapshot: vi.fn(() => false),
    setExternalFeedSnapshot: vi.fn(),
}))

vi.mock('@/server/services/external-feed/fetcher', () => ({
    fetchExternalFeedSource: vi.fn(),
}))

vi.mock('@/server/services/external-feed/parser', () => ({
    parseExternalFeedXml: vi.fn(),
}))

import { getExternalFeedRegistryConfig } from '@/server/services/external-feed/registry'
import {
    canUseStaleExternalFeedSnapshot,
    getExternalFeedSnapshot,
    isExternalFeedSnapshotFresh,
    setExternalFeedSnapshot,
} from '@/server/services/external-feed/cache'
import { fetchExternalFeedSource } from '@/server/services/external-feed/fetcher'
import { parseExternalFeedXml } from '@/server/services/external-feed/parser'

describe('getExternalFeedHomePayload', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('dedupes, filters by locale and sorts aggregated items', async () => {
        vi.mocked(getExternalFeedRegistryConfig).mockResolvedValue({
            enabled: true,
            homeEnabled: true,
            homeLimit: 6,
            defaultCacheTtlSeconds: 900,
            defaultStaleWhileErrorSeconds: 86400,
            sources: [
                {
                    id: 'source-a',
                    enabled: true,
                    provider: 'rss',
                    title: 'Source A',
                    sourceUrl: 'https://example.com/a.xml',
                    siteUrl: 'https://example.com',
                    siteName: null,
                    defaultLocale: 'en-US',
                    localeStrategy: 'inherit-current',
                    includeInHome: true,
                    badgeLabel: 'RSS',
                    priority: 10,
                    timeoutMs: null,
                    cacheTtlSeconds: null,
                    staleWhileErrorSeconds: null,
                    maxItems: 10,
                },
                {
                    id: 'source-b',
                    enabled: true,
                    provider: 'rsshub',
                    title: 'Source B',
                    sourceUrl: 'https://example.com/b.xml',
                    siteUrl: 'https://example.org',
                    siteName: null,
                    defaultLocale: 'en-US',
                    localeStrategy: 'all',
                    includeInHome: true,
                    badgeLabel: 'RSSHub',
                    priority: 5,
                    timeoutMs: null,
                    cacheTtlSeconds: null,
                    staleWhileErrorSeconds: null,
                    maxItems: 10,
                },
            ],
        })
        vi.mocked(getExternalFeedSnapshot).mockResolvedValue(null)
        vi.mocked(fetchExternalFeedSource).mockResolvedValue('<rss />')
        vi.mocked(parseExternalFeedXml)
            .mockReturnValueOnce([
                {
                    id: '1',
                    sourceId: 'source-a',
                    title: 'Newest item',
                    summary: 'summary',
                    url: 'https://example.com/post-1',
                    canonicalUrl: 'https://example.com/post-1',
                    publishedAt: '2026-04-03T11:00:00.000Z',
                    authorName: null,
                    language: 'en-US',
                    coverImage: null,
                    sourceTitle: 'Source A',
                    sourceSiteUrl: 'https://example.com',
                    sourceBadge: 'RSS',
                    dedupeKey: 'https://example.com/post-1',
                    priority: 10,
                },
                {
                    id: '2',
                    sourceId: 'source-a',
                    title: 'Hidden locale item',
                    summary: 'summary',
                    url: 'https://example.com/post-2',
                    canonicalUrl: 'https://example.com/post-2',
                    publishedAt: '2026-04-03T09:00:00.000Z',
                    authorName: null,
                    language: 'zh-CN',
                    coverImage: null,
                    sourceTitle: 'Source A',
                    sourceSiteUrl: 'https://example.com',
                    sourceBadge: 'RSS',
                    dedupeKey: 'https://example.com/post-2',
                    priority: 10,
                },
            ])
            .mockReturnValueOnce([
                {
                    id: '3',
                    sourceId: 'source-b',
                    title: 'Duplicate item',
                    summary: 'summary',
                    url: 'https://example.com/post-1',
                    canonicalUrl: 'https://example.com/post-1',
                    publishedAt: '2026-04-03T10:00:00.000Z',
                    authorName: null,
                    language: null,
                    coverImage: null,
                    sourceTitle: 'Source B',
                    sourceSiteUrl: 'https://example.org',
                    sourceBadge: 'RSSHub',
                    dedupeKey: 'https://example.com/post-1',
                    priority: 5,
                },
                {
                    id: '4',
                    sourceId: 'source-b',
                    title: 'Second item',
                    summary: 'summary',
                    url: 'https://example.org/post-3',
                    canonicalUrl: 'https://example.org/post-3',
                    publishedAt: '2026-04-02T12:00:00.000Z',
                    authorName: null,
                    language: null,
                    coverImage: null,
                    sourceTitle: 'Source B',
                    sourceSiteUrl: 'https://example.org',
                    sourceBadge: 'RSSHub',
                    dedupeKey: 'https://example.org/post-3',
                    priority: 5,
                },
            ])

        const result = await getExternalFeedHomePayload('en-US')

        expect(result.degraded).toBe(false)
        expect(result.stale).toBe(false)
        expect(result.items).toHaveLength(2)
        expect(result.items[0]?.title).toBe('Newest item')
        expect(result.items[1]?.title).toBe('Second item')
        expect(setExternalFeedSnapshot).toHaveBeenCalledTimes(2)
    })

    it('falls back to stale snapshot when refresh fails', async () => {
        vi.mocked(getExternalFeedRegistryConfig).mockResolvedValue({
            enabled: true,
            homeEnabled: true,
            homeLimit: 4,
            defaultCacheTtlSeconds: 900,
            defaultStaleWhileErrorSeconds: 86400,
            sources: [
                {
                    id: 'source-a',
                    enabled: true,
                    provider: 'rss',
                    title: 'Source A',
                    sourceUrl: 'https://example.com/a.xml',
                    siteUrl: 'https://example.com',
                    siteName: null,
                    defaultLocale: 'en-US',
                    localeStrategy: 'inherit-current',
                    includeInHome: true,
                    badgeLabel: 'RSS',
                    priority: 10,
                    timeoutMs: null,
                    cacheTtlSeconds: null,
                    staleWhileErrorSeconds: null,
                    maxItems: 10,
                },
            ],
        })
        vi.mocked(getExternalFeedSnapshot).mockResolvedValue({
            sourceId: 'source-a',
            localeBucket: 'en-US',
            fetchedAt: '2026-04-03T11:00:00.000Z',
            expiresAt: '2026-04-03T11:10:00.000Z',
            staleUntil: '2099-04-03T11:10:00.000Z',
            items: [
                {
                    id: '1',
                    sourceId: 'source-a',
                    title: 'Cached item',
                    summary: 'summary',
                    url: 'https://example.com/post-1',
                    canonicalUrl: 'https://example.com/post-1',
                    publishedAt: '2026-04-03T10:00:00.000Z',
                    authorName: null,
                    language: 'en-US',
                    coverImage: null,
                    sourceTitle: 'Source A',
                    sourceSiteUrl: 'https://example.com',
                    sourceBadge: 'RSS',
                    dedupeKey: 'https://example.com/post-1',
                    priority: 10,
                },
            ],
        })
        vi.mocked(fetchExternalFeedSource).mockRejectedValue(new Error('timeout'))
        vi.mocked(canUseStaleExternalFeedSnapshot).mockReturnValue(true)

        const result = await getExternalFeedHomePayload('en-US')

        expect(result.degraded).toBe(true)
        expect(result.stale).toBe(true)
        expect(result.items[0]?.title).toBe('Cached item')
    })

    it('ignores RSSHub language metadata when filtering localized results', async () => {
        vi.mocked(getExternalFeedRegistryConfig).mockResolvedValue({
            enabled: true,
            homeEnabled: true,
            homeLimit: 6,
            defaultCacheTtlSeconds: 900,
            defaultStaleWhileErrorSeconds: 86400,
            sources: [
                {
                    id: 'rsshub-bilibili',
                    enabled: true,
                    provider: 'rsshub',
                    title: 'RSSHub Bilibili',
                    sourceUrl: 'https://example.com/rsshub.xml',
                    siteUrl: 'https://space.bilibili.com/10822025',
                    siteName: null,
                    defaultLocale: 'zh-CN',
                    localeStrategy: 'all',
                    includeInHome: true,
                    badgeLabel: 'bilibili',
                    priority: 30,
                    timeoutMs: null,
                    cacheTtlSeconds: null,
                    staleWhileErrorSeconds: null,
                    maxItems: 6,
                },
            ],
        })
        vi.mocked(getExternalFeedSnapshot).mockResolvedValue({
            sourceId: 'rsshub-bilibili',
            localeBucket: 'all',
            fetchedAt: '2026-04-04T01:00:00.000Z',
            expiresAt: '2099-04-04T01:10:00.000Z',
            staleUntil: '2099-04-05T01:10:00.000Z',
            items: [
                {
                    id: '1',
                    sourceId: 'rsshub-bilibili',
                    title: 'Bilibili dynamic item',
                    summary: 'summary',
                    url: 'https://t.bilibili.com/1186983966847008773',
                    canonicalUrl: 'https://t.bilibili.com/1186983966847008773',
                    publishedAt: '2026-04-03T08:24:01.000Z',
                    authorName: '草梅友仁',
                    language: 'en',
                    coverImage: null,
                    sourceTitle: 'RSSHub Bilibili',
                    sourceSiteUrl: 'https://space.bilibili.com/10822025',
                    sourceBadge: 'bilibili',
                    dedupeKey: 'https://t.bilibili.com/1186983966847008773',
                    priority: 30,
                },
            ],
        })
        vi.mocked(isExternalFeedSnapshotFresh).mockReturnValue(true)

        const result = await getExternalFeedHomePayload('zh-CN')

        expect(result.degraded).toBe(false)
        expect(result.stale).toBe(false)
        expect(result.items).toHaveLength(1)
        expect(result.items[0]?.title).toBe('Bilibili dynamic item')
    })

    it('returns empty payload when registry or home feed is disabled', async () => {
        vi.mocked(getExternalFeedRegistryConfig).mockResolvedValue({
            enabled: false,
            homeEnabled: false,
            homeLimit: 6,
            defaultCacheTtlSeconds: 900,
            defaultStaleWhileErrorSeconds: 86400,
            sources: [],
        })

        const result = await getExternalFeedHomePayload('en-US')

        expect(result).toEqual({
            items: [],
            degraded: false,
            stale: false,
            fetchedAt: null,
            sourceCount: 0,
        })
    })

    it('returns degraded without snapshot when refresh fails and no stale cache exists', async () => {
        vi.mocked(getExternalFeedRegistryConfig).mockResolvedValue({
            enabled: true,
            homeEnabled: true,
            homeLimit: 6,
            defaultCacheTtlSeconds: 900,
            defaultStaleWhileErrorSeconds: 86400,
            sources: [
                {
                    id: 'source-a',
                    enabled: true,
                    provider: 'rss',
                    title: 'Source A',
                    sourceUrl: 'https://example.com/a.xml',
                    siteUrl: 'https://example.com',
                    siteName: null,
                    defaultLocale: 'en-US',
                    localeStrategy: 'inherit-current',
                    includeInHome: true,
                    badgeLabel: 'RSS',
                    priority: 10,
                    timeoutMs: null,
                    cacheTtlSeconds: null,
                    staleWhileErrorSeconds: null,
                    maxItems: 10,
                },
            ],
        })
        vi.mocked(getExternalFeedSnapshot).mockResolvedValue(null)
        vi.mocked(fetchExternalFeedSource).mockRejectedValue(new Error('connection refused'))

        const result = await getExternalFeedHomePayload('en-US')

        expect(result.degraded).toBe(true)
        expect(result.stale).toBe(false)
        expect(result.items).toEqual([])
        expect(result.fetchedAt).toBeNull()
    })

    it('replaces existing dedupe item when same timestamp has higher priority', async () => {
        vi.mocked(getExternalFeedRegistryConfig).mockResolvedValue({
            enabled: true,
            homeEnabled: true,
            homeLimit: 6,
            defaultCacheTtlSeconds: 900,
            defaultStaleWhileErrorSeconds: 86400,
            sources: [
                {
                    id: 'source-low',
                    enabled: true,
                    provider: 'rss',
                    title: 'Source Low',
                    sourceUrl: 'https://example.com/low.xml',
                    siteUrl: 'https://example.com',
                    siteName: null,
                    defaultLocale: 'en-US',
                    localeStrategy: 'all',
                    includeInHome: true,
                    badgeLabel: 'RSS',
                    priority: 1,
                    timeoutMs: null,
                    cacheTtlSeconds: null,
                    staleWhileErrorSeconds: null,
                    maxItems: 10,
                },
            ],
        })
        vi.mocked(getExternalFeedSnapshot).mockResolvedValue(null)
        vi.mocked(fetchExternalFeedSource).mockResolvedValue('<rss />')
        vi.mocked(parseExternalFeedXml).mockReturnValue([
            {
                id: 'a',
                sourceId: 'source-low',
                title: 'Same time low priority',
                summary: null,
                url: 'https://example.com/post-same',
                canonicalUrl: 'https://example.com/post-same',
                publishedAt: '2026-04-03T10:00:00.000Z',
                authorName: null,
                language: null,
                coverImage: null,
                sourceTitle: 'Source Low',
                sourceSiteUrl: 'https://example.com',
                sourceBadge: 'RSS',
                dedupeKey: 'https://example.com/post-same',
                priority: 1,
            },
            {
                id: 'b',
                sourceId: 'source-high',
                title: 'Same time high priority',
                summary: null,
                url: 'https://example.com/post-same',
                canonicalUrl: 'https://example.com/post-same',
                publishedAt: '2026-04-03T10:00:00.000Z',
                authorName: null,
                language: null,
                coverImage: null,
                sourceTitle: 'Source High',
                sourceSiteUrl: 'https://example.com',
                sourceBadge: 'RSS',
                dedupeKey: 'https://example.com/post-same',
                priority: 9,
            },
        ])

        const result = await getExternalFeedHomePayload('en-US')

        expect(result.items).toHaveLength(1)
        expect(result.items[0]?.title).toBe('Same time high priority')
    })

    it('sorts same-timestamp items by priority then source id', async () => {
        vi.mocked(getExternalFeedRegistryConfig).mockResolvedValue({
            enabled: true,
            homeEnabled: true,
            homeLimit: 6,
            defaultCacheTtlSeconds: 900,
            defaultStaleWhileErrorSeconds: 86400,
            sources: [
                {
                    id: 'source-a',
                    enabled: true,
                    provider: 'rss',
                    title: 'Source A',
                    sourceUrl: 'https://example.com/a.xml',
                    siteUrl: 'https://example.com',
                    siteName: null,
                    defaultLocale: 'en-US',
                    localeStrategy: 'all',
                    includeInHome: true,
                    badgeLabel: 'RSS',
                    priority: 1,
                    timeoutMs: null,
                    cacheTtlSeconds: null,
                    staleWhileErrorSeconds: null,
                    maxItems: 10,
                },
            ],
        })
        vi.mocked(getExternalFeedSnapshot).mockResolvedValue(null)
        vi.mocked(fetchExternalFeedSource).mockResolvedValue('<rss />')
        vi.mocked(parseExternalFeedXml).mockReturnValue([
            {
                id: 'b',
                sourceId: 'source-b',
                title: 'B source',
                summary: null,
                url: 'https://example.org/post-b',
                canonicalUrl: 'https://example.org/post-b',
                publishedAt: '2026-04-03T10:00:00.000Z',
                authorName: null,
                language: null,
                coverImage: null,
                sourceTitle: 'B',
                sourceSiteUrl: 'https://example.org',
                sourceBadge: 'RSS',
                dedupeKey: 'dedupe-b',
                priority: 1,
            },
            {
                id: 'a',
                sourceId: 'source-a',
                title: 'A source',
                summary: null,
                url: 'https://example.com/post-a',
                canonicalUrl: 'https://example.com/post-a',
                publishedAt: '2026-04-03T10:00:00.000Z',
                authorName: null,
                language: null,
                coverImage: null,
                sourceTitle: 'A',
                sourceSiteUrl: 'https://example.com',
                sourceBadge: 'RSS',
                dedupeKey: 'dedupe-a',
                priority: 1,
            },
        ])

        const result = await getExternalFeedHomePayload('en-US')

        expect(result.items.map((item) => item.sourceId)).toEqual(['source-a', 'source-b'])
    })

    it('filters fixed-locale items by source default locale', async () => {
        vi.mocked(getExternalFeedRegistryConfig).mockResolvedValue({
            enabled: true,
            homeEnabled: true,
            homeLimit: 6,
            defaultCacheTtlSeconds: 900,
            defaultStaleWhileErrorSeconds: 86400,
            sources: [
                {
                    id: 'fixed-zh',
                    enabled: true,
                    provider: 'rss',
                    title: 'Fixed zh',
                    sourceUrl: 'https://example.com/zh.xml',
                    siteUrl: 'https://example.com',
                    siteName: null,
                    defaultLocale: 'zh-CN',
                    localeStrategy: 'fixed',
                    includeInHome: true,
                    badgeLabel: 'RSS',
                    priority: 10,
                    timeoutMs: null,
                    cacheTtlSeconds: null,
                    staleWhileErrorSeconds: null,
                    maxItems: 10,
                },
            ],
        })
        vi.mocked(getExternalFeedSnapshot).mockResolvedValue(null)
        vi.mocked(fetchExternalFeedSource).mockResolvedValue('<rss />')
        vi.mocked(parseExternalFeedXml).mockReturnValue([
            {
                id: '1',
                sourceId: 'fixed-zh',
                title: 'Zh item',
                summary: null,
                url: 'https://example.com/zh/1',
                canonicalUrl: 'https://example.com/zh/1',
                publishedAt: '2026-04-03T10:00:00.000Z',
                authorName: null,
                language: null,
                coverImage: null,
                sourceTitle: 'Fixed zh',
                sourceSiteUrl: 'https://example.com',
                sourceBadge: 'RSS',
                dedupeKey: 'https://example.com/zh/1',
                priority: 10,
            },
        ])

        // 请求 zh-CN 时命中 defaultLocale → 包含
        const zhResult = await getExternalFeedHomePayload('zh-CN')
        // 请求 en-US 时与 defaultLocale 不匹配 → 排除
        const enResult = await getExternalFeedHomePayload('en-US')

        expect(zhResult.items).toHaveLength(1)
        expect(enResult.items).toHaveLength(0)
    })

    describe('refreshExternalFeedCaches', () => {
        it('returns empty summary when registry disabled', async () => {
            vi.mocked(getExternalFeedRegistryConfig).mockResolvedValue({
                enabled: false,
                homeEnabled: false,
                homeLimit: 6,
                defaultCacheTtlSeconds: 900,
                defaultStaleWhileErrorSeconds: 86400,
                sources: [],
            })

            const result = await refreshExternalFeedCaches(['en-US'])

            expect(result).toMatchObject({
                sourceCount: 0,
                snapshotCount: 0,
                failureCount: 0,
            })
        })

        it('refreshes each locale bucket and counts failures', async () => {
            vi.mocked(getExternalFeedRegistryConfig).mockResolvedValue({
                enabled: true,
                homeEnabled: true,
                homeLimit: 6,
                defaultCacheTtlSeconds: 900,
                defaultStaleWhileErrorSeconds: 86400,
                sources: [
                    {
                        id: 'source-a',
                        enabled: true,
                        provider: 'rss',
                        title: 'Source A',
                        sourceUrl: 'https://example.com/a.xml',
                        siteUrl: 'https://example.com',
                        siteName: null,
                        defaultLocale: 'en-US',
                        localeStrategy: 'inherit-current',
                        includeInHome: true,
                        badgeLabel: 'RSS',
                        priority: 10,
                        timeoutMs: null,
                        cacheTtlSeconds: null,
                        staleWhileErrorSeconds: null,
                        maxItems: 10,
                    },
                    {
                        id: 'source-b',
                        enabled: true,
                        provider: 'rss',
                        title: 'Source B',
                        sourceUrl: 'https://example.com/b.xml',
                        siteUrl: 'https://example.com',
                        siteName: null,
                        defaultLocale: 'zh-CN',
                        localeStrategy: 'fixed',
                        includeInHome: true,
                        badgeLabel: 'RSS',
                        priority: 5,
                        timeoutMs: null,
                        cacheTtlSeconds: null,
                        staleWhileErrorSeconds: null,
                        maxItems: 10,
                    },
                ],
            })
            vi.mocked(fetchExternalFeedSource)
                .mockResolvedValueOnce('<rss />')
                .mockRejectedValueOnce(new Error('boom'))
                .mockResolvedValueOnce('<rss />')
                .mockRejectedValueOnce(new Error('boom'))

            const result = await refreshExternalFeedCaches(['en-US', 'zh-CN'])

            expect(result.sourceCount).toBe(2)
            expect(result.snapshotCount).toBe(2)
            expect(result.failureCount).toBe(2)
            expect(setExternalFeedSnapshot).toHaveBeenCalledTimes(2)
        })
    })
})
