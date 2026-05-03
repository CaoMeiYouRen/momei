import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './creator-stats.get'
import { dataSource } from '@/server/database'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import {
    buildCreatorStats,
    resolveDistributionChannelEnabled,
} from '@/server/utils/creator-stats'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdminOrAuthor: vi.fn(),
}))

vi.mock('@/server/utils/creator-stats', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/creator-stats')>()

    return {
        ...actual,
        buildCreatorStats: vi.fn(),
        resolveDistributionChannelEnabled: vi.fn(),
    }
})

type QueryBuilderMock = {
    select: ReturnType<typeof vi.fn>
    addSelect: ReturnType<typeof vi.fn>
    where: ReturnType<typeof vi.fn>
    andWhere: ReturnType<typeof vi.fn>
    groupBy: ReturnType<typeof vi.fn>
    orderBy: ReturnType<typeof vi.fn>
    getRawOne: ReturnType<typeof vi.fn>
    getRawMany: ReturnType<typeof vi.fn>
    getMany: ReturnType<typeof vi.fn>
}

function createRawQueryBuilder(rows: unknown[]): QueryBuilderMock {
    const queryBuilder: QueryBuilderMock = {
        select: vi.fn(),
        addSelect: vi.fn(),
        where: vi.fn(),
        andWhere: vi.fn(),
        groupBy: vi.fn(),
        orderBy: vi.fn(),
        getRawOne: vi.fn().mockResolvedValue(null),
        getRawMany: vi.fn().mockResolvedValue(rows),
        getMany: vi.fn().mockResolvedValue(rows),
    }

    for (const key of Object.keys(queryBuilder) as (keyof QueryBuilderMock)[]) {
        const fn = queryBuilder[key]
        if (key !== 'getRawOne' && key !== 'getRawMany' && key !== 'getMany') {
            fn.mockReturnValue(queryBuilder)
        }
    }

    return queryBuilder
}

function mockSession(role: string, id = `${role}-1`) {
    vi.mocked(requireAdminOrAuthor).mockResolvedValue({
        user: { id, role },
    } as any)
}

function mockRepo(...qbs: QueryBuilderMock[]) {
    const mockCreateQueryBuilder = vi.fn()
    for (const qb of qbs) {
        mockCreateQueryBuilder.mockReturnValueOnce(qb)
    }
    vi.mocked(dataSource.getRepository).mockReturnValue({ createQueryBuilder: mockCreateQueryBuilder } as any)
}

describe('GET /api/admin/creator-stats', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('getQuery', vi.fn((event: { query?: unknown }) => event.query || {}))

        vi.mocked(buildCreatorStats).mockReturnValue({
            range: 30,
            aggregationGranularity: 'week' as const,
            timezone: 'UTC',
            publishing: { totalPublished: 0, draftCount: 0, trend: [] },
            distribution: { wechatsync: null, hexoRepositorySync: null },
            generatedAt: new Date().toISOString(),
        })

        vi.mocked(resolveDistributionChannelEnabled).mockResolvedValue({
            wechatsync: true,
            hexoRepositorySync: false,
        })
    })

    it('returns empty stats for author with no posts', async () => {
        mockSession('author')
        const publishedCountQb = createRawQueryBuilder([{ count: '0' }])
        const draftCountQb = createRawQueryBuilder([{ count: '0' }])
        const trendQb = createRawQueryBuilder([])
        const distQb = createRawQueryBuilder([])
        mockRepo(publishedCountQb, draftCountQb, trendQb, distQb)

        const event = { query: {} } as any as Parameters<typeof handler>[0]
        const result = await handler(event)

        expect(result.publishing.totalPublished).toBe(0)
        expect(result.publishing.draftCount).toBe(0)
        expect(result.publishing.trend).toEqual([])
    })

    it('includes authorId filter for author role', async () => {
        mockSession('author')
        const publishedCountQb = createRawQueryBuilder([{ count: '5' }])
        const draftCountQb = createRawQueryBuilder([{ count: '1' }])
        const trendQb = createRawQueryBuilder([{ periodStart: '2026-05-04', count: '3' }])
        const distQb = createRawQueryBuilder([])
        mockRepo(publishedCountQb, draftCountQb, trendQb, distQb)

        await handler({ query: {} } as any as Parameters<typeof handler>[0])

        expect(publishedCountQb.andWhere).toHaveBeenCalledWith(
            'post.authorId = :authorId',
            { authorId: 'author-1' },
        )
        expect(draftCountQb.andWhere).toHaveBeenCalledWith(
            'post.authorId = :authorId',
            { authorId: 'author-1' },
        )
    })

    it('admin can see all posts without authorId filter', async () => {
        mockSession('admin')
        const publishedCountQb = createRawQueryBuilder([{ count: '10' }])
        const draftCountQb = createRawQueryBuilder([{ count: '3' }])
        const trendQb = createRawQueryBuilder([{ periodStart: '2026-05-04', count: '5' }])
        const distQb = createRawQueryBuilder([])
        mockRepo(publishedCountQb, draftCountQb, trendQb, distQb)

        await handler({ query: {} } as any as Parameters<typeof handler>[0])

        const calls = vi.mocked(publishedCountQb.andWhere).mock.calls
        const authorIdCalls = calls.filter((call: unknown[]) =>
            typeof call[0] === 'string' && call[0].includes('authorId'),
        )
        expect(authorIdCalls.length).toBe(0)
    })

    it('admin can filter by specific authorId', async () => {
        mockSession('admin')
        const publishedCountQb = createRawQueryBuilder([{ count: '3' }])
        const draftCountQb = createRawQueryBuilder([{ count: '0' }])
        const trendQb = createRawQueryBuilder([])
        const distQb = createRawQueryBuilder([])
        mockRepo(publishedCountQb, draftCountQb, trendQb, distQb)

        await handler({ query: { authorId: '11111111-1111-4111-8111-111111111111' } } as any as Parameters<typeof handler>[0])

        expect(publishedCountQb.andWhere).toHaveBeenCalledWith(
            'post.authorId = :authorId',
            { authorId: '11111111-1111-4111-8111-111111111111' },
        )
    })

    it('author role ignores authorId query param', async () => {
        mockSession('author')
        const publishedCountQb = createRawQueryBuilder([{ count: '5' }])
        const draftCountQb = createRawQueryBuilder([{ count: '1' }])
        const trendQb = createRawQueryBuilder([])
        const distQb = createRawQueryBuilder([])
        mockRepo(publishedCountQb, draftCountQb, trendQb, distQb)

        await handler({ query: { authorId: '99999999-9999-4999-8999-999999999999' } } as any as Parameters<typeof handler>[0])

        expect(publishedCountQb.andWhere).toHaveBeenCalledWith(
            'post.authorId = :authorId',
            { authorId: 'author-1' },
        )
    })

    it('returns correct stats for structured response', async () => {
        mockSession('author')

        vi.mocked(buildCreatorStats).mockReturnValue({
            range: 30,
            aggregationGranularity: 'week' as const,
            timezone: 'Asia/Shanghai',
            publishing: {
                totalPublished: 12,
                draftCount: 4,
                trend: [
                    { periodStart: '2026-04-27', count: 3 },
                    { periodStart: '2026-05-04', count: 5 },
                ],
            },
            distribution: {
                wechatsync: {
                    enabled: true,
                    overallSuccessRate: 0.8,
                    trend: [
                        { periodStart: '2026-05-04', total: 5, succeeded: 4, failed: 1 },
                    ],
                },
                hexoRepositorySync: null,
            },
            generatedAt: '2026-05-03T10:00:00.000Z',
        })

        const publishedCountQb = createRawQueryBuilder([{ count: '12' }])
        const draftCountQb = createRawQueryBuilder([{ count: '4' }])
        const trendQb = createRawQueryBuilder([])
        const distQb = createRawQueryBuilder([])
        mockRepo(publishedCountQb, draftCountQb, trendQb, distQb)

        const result = await handler({ query: { range: '30', timezone: 'Asia/Shanghai' } } as any as Parameters<typeof handler>[0])

        expect(result.range).toBe(30)
        expect(result.publishing.totalPublished).toBe(12)
        expect(result.publishing.draftCount).toBe(4)
        expect(result.publishing.trend.length).toBe(2)
        expect(result.distribution.wechatsync).not.toBeNull()
        expect(result.distribution.wechatsync!.overallSuccessRate).toBe(0.8)
        expect(result.distribution.hexoRepositorySync).toBeNull()
    })
})
