import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './tasks.get'
import { dataSource } from '@/server/database'
import { requireAdmin } from '@/server/utils/permission'

vi.mock('@/server/database')
vi.mock('@/server/utils/permission', () => ({
    requireAdmin: vi.fn(),
}))
vi.mock('@/server/services/ai/cost-display', () => ({
    getAICostDisplayConfig: vi.fn().mockResolvedValue({
        currencyCode: 'CNY',
        currencySymbol: '¥',
        quotaUnitPrice: 0.1,
    }),
}))

function createQueryBuilderMock(rawData: any[], total: number) {
    const queryBuilder: Record<string, any> = {
        leftJoin: vi.fn(),
        select: vi.fn(),
        addSelect: vi.fn(),
        orderBy: vi.fn(),
        skip: vi.fn(),
        take: vi.fn(),
        andWhere: vi.fn(),
        getCount: vi.fn().mockResolvedValue(total),
        getRawMany: vi.fn().mockResolvedValue(rawData),
    }

    Object.keys(queryBuilder).forEach((key) => {
        if (key !== 'getCount' && key !== 'getRawMany') {
            queryBuilder[key].mockReturnValue(queryBuilder)
        }
    })

    return queryBuilder
}

describe('GET /api/admin/ai/tasks', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } } as never)
        vi.stubGlobal('getValidatedQuery', vi.fn((event: { query?: unknown }, parser: (query: unknown) => unknown) => Promise.resolve(parser(event.query || {
            page: '1',
            pageSize: '10',
            search: 'openai',
            status: 'completed',
        }))))
    })

    it('should return normalized numeric governance fields', async () => {
        const rawData = [{
            id: 'task-1',
            category: 'image',
            type: 'image_generation',
            status: 'completed',
            provider: 'openai',
            model: 'gpt-image-1',
            estimatedCost: '1.25',
            actualCost: '1.20',
            estimatedQuotaUnits: '20',
            quotaUnits: '18',
            chargeStatus: 'actual',
            failureStage: null,
            durationMs: '3600',
            usageSnapshot: '{"imageCount":1}',
            createdAt: '2026-03-08 00:00:00',
            startedAt: '2026-03-08 00:00:01',
            completedAt: '2026-03-08 00:00:05',
            userId: 'user-1',
            payload: '{}',
            result: '{}',
            error: null,
            audioDuration: '0',
            audioSize: '0',
            textLength: '0',
            language: null,
            user_name: 'Author',
            user_email: 'author@example.com',
            user_image: null,
        }]

        vi.mocked(dataSource.getRepository).mockReturnValue({
            createQueryBuilder: vi.fn(() => createQueryBuilderMock(rawData, 1)),
        } as any)

        const result = await handler({} as any)

        expect(result.total).toBe(1)
        expect(result.items[0]).toEqual(expect.objectContaining({
            estimatedCost: 1.25,
            actualCost: 1.2,
            estimatedQuotaUnits: 20,
            quotaUnits: 18,
            durationMs: 3600,
        }))
        expect(result.items[0]).not.toHaveProperty('payload')
        expect(result.items[0]).not.toHaveProperty('result')
        expect(result.items[0]).not.toHaveProperty('usageSnapshot')
        expect(result.costDisplay).toEqual(expect.objectContaining({
            currencyCode: 'CNY',
            currencySymbol: '¥',
        }))
    })
})
