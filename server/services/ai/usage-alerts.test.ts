import { beforeEach, describe, expect, it, vi } from 'vitest'
import { evaluateAIUsageAlerts } from './usage-alerts'
import { dataSource } from '@/server/database'
import { getSetting } from '@/server/services/setting'
import { AITask } from '@/server/entities/ai-task'
import { User } from '@/server/entities/user'

vi.mock('@/server/database', () => ({
    dataSource: {
        isInitialized: true,
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/services/setting', () => ({
    getSetting: vi.fn(),
}))

describe('evaluateAIUsageAlerts', () => {
    const mockTaskRepo = {
        find: vi.fn(),
    }

    const mockUserRepo = {
        find: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockImplementation((entity: unknown) => {
            if (entity === AITask) {
                return mockTaskRepo as never
            }

            if (entity === User) {
                return mockUserRepo as never
            }

            throw new Error('Unknown repository')
        })
    })

    it('emits quota and cost alerts using the highest triggered threshold', async () => {
        vi.mocked(getSetting).mockImplementation((key: string, defaultValue?: unknown) => {
            const settingKey = String(key)

            if (settingKey === 'ai_alert_thresholds') {
                return Promise.resolve(JSON.stringify({
                    quotaUsageRatios: [0.5, 0.8, 1],
                    costUsageRatios: [0.8, 1],
                    failureBurst: {
                        enabled: false,
                    },
                }))
            }

            if (settingKey === 'ai_quota_enabled') {
                return Promise.resolve('true')
            }

            if (settingKey === 'ai_quota_policies') {
                return Promise.resolve(JSON.stringify([
                    {
                        subjectType: 'global',
                        subjectValue: 'default',
                        scope: 'all',
                        period: 'day',
                        maxQuotaUnits: 20,
                        maxActualCost: 10,
                        enabled: true,
                    },
                ]))
            }

            return Promise.resolve(typeof defaultValue === 'string' ? defaultValue : '')
        })

        mockTaskRepo.find.mockResolvedValue([
            {
                userId: 'user-1',
                category: 'text',
                type: 'summarize',
                status: 'completed',
                quotaUnits: 18,
                estimatedQuotaUnits: 18,
                actualCost: 9,
                estimatedCost: 9,
                createdAt: new Date('2026-03-08T09:00:00.000Z'),
            },
        ])
        mockUserRepo.find.mockResolvedValue([
            {
                id: 'user-1',
                name: 'Author',
                role: 'author',
            },
        ])

        const alerts = await evaluateAIUsageAlerts({
            now: new Date('2026-03-08T10:00:00.000Z'),
        })

        expect(alerts).toEqual(expect.arrayContaining([
            expect.objectContaining({
                kind: 'quota_usage',
                severity: 'warning',
                threshold: 0.8,
                usedValue: 18,
                limitValue: 20,
            }),
            expect.objectContaining({
                kind: 'cost_usage',
                severity: 'warning',
                threshold: 0.8,
                usedValue: 9,
                limitValue: 10,
            }),
        ]))
        expect(alerts.some((alert) => alert.kind === 'quota_usage' && alert.threshold === 0.5)).toBe(false)
    })

    it('emits failure burst alerts for configured high-cost categories', async () => {
        vi.mocked(getSetting).mockImplementation((key: string, defaultValue?: unknown) => {
            const settingKey = String(key)

            if (settingKey === 'ai_alert_thresholds') {
                return Promise.resolve(JSON.stringify({
                    quotaUsageRatios: [0.8],
                    costUsageRatios: [1],
                    failureBurst: {
                        enabled: true,
                        windowMinutes: 10,
                        maxFailures: 2,
                        categories: ['image'],
                    },
                }))
            }

            if (settingKey === 'ai_quota_enabled') {
                return Promise.resolve('false')
            }

            if (settingKey === 'ai_quota_policies') {
                return Promise.resolve('[]')
            }

            return Promise.resolve(typeof defaultValue === 'string' ? defaultValue : '')
        })

        mockTaskRepo.find.mockResolvedValue([
            {
                userId: 'user-2',
                category: 'image',
                type: 'image_generation',
                status: 'failed',
                quotaUnits: 0,
                estimatedQuotaUnits: 0,
                actualCost: 0,
                estimatedCost: 0,
                createdAt: new Date('2026-03-08T09:52:00.000Z'),
            },
            {
                userId: 'user-2',
                category: 'image',
                type: 'image_generation',
                status: 'failed',
                quotaUnits: 0,
                estimatedQuotaUnits: 0,
                actualCost: 0,
                estimatedCost: 0,
                createdAt: new Date('2026-03-08T09:58:00.000Z'),
            },
        ])
        mockUserRepo.find.mockResolvedValue([
            {
                id: 'user-2',
                name: 'Low Trust User',
                role: 'user',
            },
        ])

        const alerts = await evaluateAIUsageAlerts({
            now: new Date('2026-03-08T10:00:00.000Z'),
        })

        expect(alerts).toEqual([
            expect.objectContaining({
                kind: 'failure_burst',
                scope: 'image',
                subjectValue: 'user-2',
                failureCount: 2,
                limitValue: 2,
            }),
        ])
    })
})
