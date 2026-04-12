import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getSettingsMock, getSettingDefaultValueMock } = vi.hoisted(() => ({
    getSettingsMock: vi.fn(),
    getSettingDefaultValueMock: vi.fn((key: SettingKey) => {
        const defaults: Partial<Record<SettingKey, string>> = {
            [SettingKey.EXTERNAL_FEED_ENABLED]: 'false',
            [SettingKey.EXTERNAL_FEED_HOME_ENABLED]: 'false',
            [SettingKey.EXTERNAL_FEED_HOME_LIMIT]: '6',
            [SettingKey.EXTERNAL_FEED_CACHE_TTL_SECONDS]: '900',
            [SettingKey.EXTERNAL_FEED_STALE_WHILE_ERROR_SECONDS]: '86400',
            [SettingKey.EXTERNAL_FEED_SOURCES]: '[]',
        }

        return defaults[key] ?? null
    }),
}))

vi.mock('@/server/services/setting', () => ({
    getSettings: getSettingsMock,
    getSettingDefaultValue: getSettingDefaultValueMock,
}))

import { getExternalFeedRegistryConfig, resolveExternalFeedLocaleBucket } from './registry'
import { SettingKey } from '@/types/setting'

describe('resolveExternalFeedLocaleBucket', () => {
    it('returns all when strategy is all', () => {
        expect(resolveExternalFeedLocaleBucket({ localeStrategy: 'all' } as never, 'zh-CN')).toBe('all')
    })

    it('returns default locale for fixed strategy', () => {
        expect(resolveExternalFeedLocaleBucket({ localeStrategy: 'fixed', defaultLocale: 'en-US' } as never, 'zh-CN')).toBe('en-US')
    })

    it('falls back to request locale for auto strategy', () => {
        expect(resolveExternalFeedLocaleBucket({ localeStrategy: 'locale' } as never, 'ja-JP')).toBe('ja-JP')
    })
})

describe('getExternalFeedRegistryConfig', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('uses defaults when settings are missing', async () => {
        getSettingsMock.mockResolvedValue({})

        const result = await getExternalFeedRegistryConfig()

        expect(result).toEqual({
            enabled: false,
            homeEnabled: false,
            homeLimit: 6,
            defaultCacheTtlSeconds: 900,
            defaultStaleWhileErrorSeconds: 86400,
            sources: [],
        })
    })

    it('parses settings and filters disabled sources', async () => {
        getSettingsMock.mockResolvedValue({
            [SettingKey.EXTERNAL_FEED_ENABLED]: 'true',
            [SettingKey.EXTERNAL_FEED_HOME_ENABLED]: 'true',
            [SettingKey.EXTERNAL_FEED_HOME_LIMIT]: '20',
            [SettingKey.EXTERNAL_FEED_CACHE_TTL_SECONDS]: '30',
            [SettingKey.EXTERNAL_FEED_STALE_WHILE_ERROR_SECONDS]: '999999',
            [SettingKey.EXTERNAL_FEED_SOURCES]: JSON.stringify([
                {
                    id: 'feed-1',
                    enabled: true,
                    provider: 'rss',
                    title: 'Feed 1',
                    sourceUrl: 'https://example.com/rss.xml',
                    localeStrategy: 'fixed',
                    defaultLocale: 'en-US',
                    includeInHome: true,
                    priority: 1,
                },
                {
                    id: 'feed-2',
                    enabled: false,
                    provider: 'rss',
                    title: 'Feed 2',
                    sourceUrl: 'https://example.com/2.xml',
                    localeStrategy: 'all',
                    includeInHome: false,
                    priority: 2,
                },
            ]),
        })

        const result = await getExternalFeedRegistryConfig()

        expect(result.enabled).toBe(true)
        expect(result.homeEnabled).toBe(true)
        expect(result.homeLimit).toBe(12)
        expect(result.defaultCacheTtlSeconds).toBe(60)
        expect(result.defaultStaleWhileErrorSeconds).toBe(604800)
        expect(result.sources).toHaveLength(1)
        expect(result.sources[0]).toMatchObject({
            id: 'feed-1',
            defaultLocale: 'en-US',
        })
    })

    it('throws structured error on invalid sources payload', async () => {
        getSettingsMock.mockResolvedValue({
            [SettingKey.EXTERNAL_FEED_SOURCES]: '{invalid json',
        })

        await expect(getExternalFeedRegistryConfig()).rejects.toMatchObject({
            statusCode: 500,
            statusMessage: 'Invalid external feed sources configuration',
        })
    })
})
