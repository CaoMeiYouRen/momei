import { describe, expect, it } from 'vitest'
import {
    bucketDistributionEvents,
    bucketPublishingTrend,
    buildCreatorStats,
    computeOverallSuccessRate,
} from './creator-stats'

describe('bucketPublishingTrend', () => {
    it('returns empty array for empty input', () => {
        const result = bucketPublishingTrend([], 'week')
        expect(result).toEqual([])
    })

    it('buckets by week correctly', () => {
        const rows = [
            { periodStart: new Date('2026-05-01T10:00:00Z'), count: 2 },
            { periodStart: new Date('2026-05-03T10:00:00Z'), count: 1 },
            { periodStart: new Date('2026-05-12T10:00:00Z'), count: 3 },
        ]
        // May 1 and May 3 are in the same ISO week (Mon Apr 27)
        // May 12 is in the next ISO week (Mon May 11)
        const result = bucketPublishingTrend(rows, 'week')

        expect(result.length).toBe(2)
        expect(result[0]!.count).toBe(3) // 2 + 1 in same week
        expect(result[1]!.count).toBe(3)
    })

    it('buckets by month correctly', () => {
        const rows = [
            { periodStart: new Date('2026-05-05T10:00:00Z'), count: 2 },
            { periodStart: new Date('2026-05-20T10:00:00Z'), count: 1 },
            { periodStart: new Date('2026-06-10T10:00:00Z'), count: 4 },
        ]
        const result = bucketPublishingTrend(rows, 'month')

        expect(result.length).toBe(2)
        expect(result[0]!.count).toBe(3) // May
        expect(result[1]!.count).toBe(4) // June
    })

    it('outputs periodStart in YYYY-MM-DD format for daily granularity', () => {
        const rows = [
            { periodStart: new Date('2026-05-05T10:00:00Z'), count: 1 },
        ]
        const result = bucketPublishingTrend(rows, 'day')

        expect(result[0]!.periodStart).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('outputs periodStart in YYYY-MM-DD format for weekly granularity', () => {
        const rows = [
            { periodStart: new Date('2026-05-05T10:00:00Z'), count: 1 },
        ]
        const result = bucketPublishingTrend(rows, 'week')

        expect(result[0]!.periodStart).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(result[0]!.periodEnd).toBeDefined()
    })

    it('outputs periodStart in YYYY-MM format for monthly granularity', () => {
        const rows = [
            { periodStart: new Date('2026-05-05T10:00:00Z'), count: 1 },
        ]
        const result = bucketPublishingTrend(rows, 'month')

        expect(result[0]!.periodStart).toMatch(/^\d{4}-\d{2}$/)
        expect(result[0]!.periodEnd).toBeDefined()
    })
})

describe('bucketDistributionEvents', () => {
    it('filters empty buckets (no events in period)', () => {
        const rows = [
            {
                weekStart: new Date('2026-05-04T00:00:00Z'),
                wechatsyncSuccess: 0,
                wechatsyncFail: 0,
                hexoSuccess: 0,
                hexoFail: 0,
            },
        ]
        const result = bucketDistributionEvents(rows, 'wechatsync')
        expect(result).toEqual([])
    })

    it('aggregates wechatsync events by week', () => {
        const rows = [
            {
                weekStart: new Date('2026-05-04T00:00:00Z'),
                wechatsyncSuccess: 3,
                wechatsyncFail: 1,
                hexoSuccess: 0,
                hexoFail: 0,
            },
            {
                weekStart: new Date('2026-05-04T00:00:00Z'),
                wechatsyncSuccess: 1,
                wechatsyncFail: 0,
                hexoSuccess: 0,
                hexoFail: 0,
            },
        ]
        const result = bucketDistributionEvents(rows, 'wechatsync')

        expect(result.length).toBe(1)
        expect(result[0]!.succeeded).toBe(4)
        expect(result[0]!.failed).toBe(1)
        expect(result[0]!.total).toBe(5)
    })

    it('aggregates hexo events separately', () => {
        const rows = [
            {
                weekStart: new Date('2026-05-04T00:00:00Z'),
                wechatsyncSuccess: 0,
                wechatsyncFail: 0,
                hexoSuccess: 2,
                hexoFail: 3,
            },
        ]
        const result = bucketDistributionEvents(rows, 'hexo')

        expect(result.length).toBe(1)
        expect(result[0]!.succeeded).toBe(2)
        expect(result[0]!.failed).toBe(3)
        expect(result[0]!.total).toBe(5)
    })

    it('orders by periodStart ascending', () => {
        const rows = [
            {
                weekStart: new Date('2026-05-11T00:00:00Z'),
                wechatsyncSuccess: 1,
                wechatsyncFail: 0,
                hexoSuccess: 0,
                hexoFail: 0,
            },
            {
                weekStart: new Date('2026-05-04T00:00:00Z'),
                wechatsyncSuccess: 2,
                wechatsyncFail: 0,
                hexoSuccess: 0,
                hexoFail: 0,
            },
        ]
        const result = bucketDistributionEvents(rows, 'wechatsync')

        expect(result[0]!.periodStart).toBe('2026-05-04')
        expect(result[1]!.periodStart).toBe('2026-05-11')
    })
})

describe('computeOverallSuccessRate', () => {
    it('returns 0 for empty trend', () => {
        expect(computeOverallSuccessRate([])).toBe(0)
    })

    it('returns 0 when no events', () => {
        const trend = [{ periodStart: '2026-05-04', total: 0, succeeded: 0, failed: 0 }]
        expect(computeOverallSuccessRate(trend)).toBe(0)
    })

    it('returns 1 for all success', () => {
        const trend = [
            { periodStart: '2026-05-04', total: 5, succeeded: 5, failed: 0 },
        ]
        expect(computeOverallSuccessRate(trend)).toBe(1)
    })

    it('returns intermediate rate correctly', () => {
        const trend = [
            { periodStart: '2026-05-04', total: 4, succeeded: 3, failed: 1 },
            { periodStart: '2026-05-11', total: 6, succeeded: 4, failed: 2 },
        ]
        const rate = computeOverallSuccessRate(trend)
        expect(rate).toBe(0.7) // (3 + 4) / (4 + 6)
    })
})

describe('buildCreatorStats', () => {
    it('builds complete response with all sections', () => {
        const params = {
            range: 30 as const,
            timezone: 'UTC',
            aggregationGranularity: 'week' as const,
            totalPublished: 25,
            draftCount: 3,
            publishingRawRows: [
                { periodStart: new Date('2026-05-04T00:00:00Z'), count: 5 },
            ],
            distributionRawRows: [
                {
                    weekStart: new Date('2026-05-04T00:00:00Z'),
                    wechatsyncSuccess: 2,
                    wechatsyncFail: 1,
                    hexoSuccess: 1,
                    hexoFail: 0,
                },
            ],
            channelEnabled: {
                wechatsync: true,
                hexoRepositorySync: true,
            },
        }

        const result = buildCreatorStats(params)

        expect(result.range).toBe(30)
        expect(result.aggregationGranularity).toBe('week')
        expect(result.timezone).toBe('UTC')
        expect(result.publishing.totalPublished).toBe(25)
        expect(result.publishing.draftCount).toBe(3)
        expect(result.publishing.trend.length).toBe(1)
        expect(result.publishing.trend[0]!.count).toBe(5)

        expect(result.distribution.wechatsync).not.toBeNull()
        expect(result.distribution.wechatsync!.enabled).toBe(true)
        expect(result.distribution.wechatsync!.trend[0]!.succeeded).toBe(2)
        expect(result.distribution.wechatsync!.overallSuccessRate).toBe(2 / 3)

        expect(result.distribution.hexoRepositorySync).not.toBeNull()
        expect(result.distribution.hexoRepositorySync!.enabled).toBe(true)
        expect(result.distribution.hexoRepositorySync!.trend[0]!.succeeded).toBe(1)
        expect(result.distribution.hexoRepositorySync!.overallSuccessRate).toBe(1)

        expect(result.generatedAt).toBeTruthy()
    })

    it('returns null for disabled channels', () => {
        const params = {
            range: 7 as const,
            timezone: 'UTC',
            aggregationGranularity: 'week' as const,
            totalPublished: 0,
            draftCount: 0,
            publishingRawRows: [],
            distributionRawRows: [],
            channelEnabled: {
                wechatsync: false,
                hexoRepositorySync: false,
            },
        }

        const result = buildCreatorStats(params)

        expect(result.distribution.wechatsync).toBeNull()
        expect(result.distribution.hexoRepositorySync).toBeNull()
        expect(result.publishing.trend).toEqual([])
    })

    it('returns 0 for overallSuccessRate when trend is empty', () => {
        const params = {
            range: 7 as const,
            timezone: 'UTC',
            aggregationGranularity: 'week' as const,
            totalPublished: 0,
            draftCount: 0,
            publishingRawRows: [],
            distributionRawRows: [],
            channelEnabled: {
                wechatsync: true,
                hexoRepositorySync: false,
            },
        }

        const result = buildCreatorStats(params)

        expect(result.distribution.wechatsync).not.toBeNull()
        expect(result.distribution.wechatsync!.overallSuccessRate).toBe(0)
        expect(result.distribution.wechatsync!.trend).toEqual([])
    })
})

describe('resolveDistributionChannelEnabled', () => {
    it('resolves from settings service', async () => {
        // Mock the getSettings to return HEXO_SYNC_ENABLED
        const { resolveDistributionChannelEnabled } = await import('./creator-stats')

        // The function imports getSettings from '@/server/services/setting'
        // which is already mocked by the module mock
        const result = await resolveDistributionChannelEnabled()

        expect(result.wechatsync).toBe(true) // Always true (no server-side toggle)
        expect(typeof result.hexoRepositorySync).toBe('boolean')
    })
})
