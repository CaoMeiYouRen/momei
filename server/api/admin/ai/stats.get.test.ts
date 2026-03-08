import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './stats.get'
import { dataSource } from '@/server/database'
import { evaluateAIUsageAlerts } from '@/server/services/ai/usage-alerts'

vi.mock('@/server/database')
vi.mock('@/server/services/ai/usage-alerts', () => ({
    evaluateAIUsageAlerts: vi.fn().mockResolvedValue([
        {
            dedupeKey: 'quota_usage:user-1:all:day:0.8',
            kind: 'quota_usage',
            severity: 'warning',
            period: 'day',
            scope: 'all',
            subjectType: 'user',
            subjectValue: 'user-1',
            subjectName: 'Author',
            threshold: 0.8,
            usedValue: 18,
            limitValue: 20,
            ratio: 0.9,
        },
    ]),
}))

function createAggregateBuilder(result: any, method: 'getRawOne' | 'getRawMany' = 'getRawMany') {
    const queryBuilder: Record<string, any> = {
        select: vi.fn(),
        addSelect: vi.fn(),
        where: vi.fn(),
        groupBy: vi.fn(),
        addGroupBy: vi.fn(),
        orderBy: vi.fn(),
        leftJoin: vi.fn(),
        limit: vi.fn(),
        getRawOne: vi.fn().mockResolvedValue(method === 'getRawOne' ? result : null),
        getRawMany: vi.fn().mockResolvedValue(method === 'getRawMany' ? result : []),
    }

    Object.keys(queryBuilder).forEach((key) => {
        if (key !== 'getRawOne' && key !== 'getRawMany') {
            queryBuilder[key].mockReturnValue(queryBuilder)
        }
    })

    return queryBuilder
}

describe('GET /api/admin/ai/stats', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('requireAdmin', vi.fn().mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } }))
        vi.mocked(evaluateAIUsageAlerts).mockResolvedValue([
            {
                dedupeKey: 'quota_usage:user-1:all:day:0.8',
                kind: 'quota_usage',
                severity: 'warning',
                period: 'day',
                scope: 'all',
                subjectType: 'user',
                subjectValue: 'user-1',
                subjectName: 'Author',
                threshold: 0.8,
                usedValue: 18,
                limitValue: 20,
                ratio: 0.9,
            },
        ])
    })

    it('should return governance overview and grouped stats', async () => {
        const builders = [
            createAggregateBuilder({
                totalTasks: '10',
                estimatedCost: '4.5',
                actualCost: '3.5',
                estimatedQuotaUnits: '32',
                quotaUnits: '28',
                avgDurationMs: '2450',
            }, 'getRawOne'),
            createAggregateBuilder([{ status: 'completed', count: '8' }, { status: 'failed', count: '2' }]),
            createAggregateBuilder([{ type: 'image_generation', count: '3' }]),
            createAggregateBuilder([{ category: 'image', count: '3', actualCost: '3.5', quotaUnits: '28' }]),
            createAggregateBuilder([{ chargeStatus: 'actual', count: '3' }]),
            createAggregateBuilder([{ failureStage: 'provider_processing', count: '2' }]),
            createAggregateBuilder([{ provider: 'openai', model: 'gpt-4o', count: '5' }]),
            createAggregateBuilder([{ userId: 'user-1', name: 'Author', actualCost: '3.5', quotaUnits: '28', taskCount: '4' }]),
            createAggregateBuilder([{ date: '2026-03-08', count: '2', actualCost: '1.5', quotaUnits: '8' }]),
        ]

        vi.mocked(dataSource.getRepository).mockReturnValue({
            createQueryBuilder: vi.fn(() => builders.shift()),
        } as any)

        const result = await handler({} as any)

        expect(result.overview).toEqual(expect.objectContaining({
            totalTasks: 10,
            actualCost: 3.5,
            quotaUnits: 28,
        }))
        expect(result.overview.successRate).toBe(0.8)
        expect(result.categoryStats[0]).toEqual(expect.objectContaining({
            category: 'image',
            quotaUnits: 28,
        }))
        expect(result.failureStageStats[0]).toEqual(expect.objectContaining({
            failureStage: 'provider_processing',
        }))
        expect(result.alerts[0]).toEqual(expect.objectContaining({
            kind: 'quota_usage',
            severity: 'warning',
        }))
        expect(evaluateAIUsageAlerts).toHaveBeenCalledTimes(1)
    })
})
