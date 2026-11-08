import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    assertAIQuotaAllowance,
    getPeriodStart,
    resolveAIQuotaPolicy,
    resolveAllAIQuotaPolicies,
    summarizeAIQuotaUsage,
} from './quota-governance'
import { dataSource } from '@/server/database'
import { getSetting } from '@/server/services/setting'
import { User } from '@/server/entities/user'
import { AITask } from '@/server/entities/ai-task'

vi.mock('@/server/database', () => ({
    dataSource: {
        isInitialized: true,
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/services/setting', () => ({
    getSetting: vi.fn(),
}))

vi.mock('@/server/utils/response', () => ({
    fail: vi.fn((message: string, statusCode = 400) => {
        const error = new Error(message) as Error & { statusCode?: number }
        error.statusCode = statusCode
        throw error
    }),
}))

describe('quota governance service', () => {
    const mockTaskRepo = {
        find: vi.fn(),
    }

    const mockUserRepo = {
        findOne: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getSetting).mockImplementation((key: string) => {
            const settingKey = String(key)

            if (settingKey === 'ai_quota_enabled') {
                return Promise.resolve('true')
            }

            return Promise.resolve('[]')
        })
        vi.mocked(dataSource.getRepository).mockImplementation((entity: unknown) => {
            if (entity === User) {
                return mockUserRepo as any
            }

            if (entity === AITask) {
                return mockTaskRepo as any
            }

            throw new Error('Unknown repository')
        })
        mockUserRepo.findOne.mockResolvedValue({ id: 'user-1', role: 'author' })
        mockTaskRepo.find.mockResolvedValue([])
    })

    it('prefers user policy over role and global policy', async () => {
        vi.mocked(getSetting).mockImplementation((key: string) => {
            const settingKey = String(key)

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
                    },
                    {
                        subjectType: 'role',
                        subjectValue: 'author',
                        scope: 'all',
                        period: 'day',
                        maxQuotaUnits: 10,
                    },
                    {
                        subjectType: 'user',
                        subjectValue: 'user-1',
                        scope: 'all',
                        period: 'day',
                        maxQuotaUnits: 5,
                    },
                ]))
            }

            return Promise.resolve('[]')
        })

        const result = await resolveAIQuotaPolicy({
            userId: 'user-1',
            category: 'text',
            type: 'summarize',
        })

        expect(result.enabled).toBe(true)
        expect(result.policies).toEqual([
            expect.objectContaining({
                scope: 'all',
                period: 'day',
                maxQuotaUnits: 5,
            }),
        ])
    })

    it('rejects request when quota units would exceed configured limit', async () => {
        vi.mocked(getSetting).mockImplementation((key: string) => {
            const settingKey = String(key)

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
                        maxQuotaUnits: 2,
                    },
                ]))
            }

            return Promise.resolve('[]')
        })

        mockTaskRepo.find.mockResolvedValue([
            {
                userId: 'user-1',
                category: 'text',
                type: 'summarize',
                status: 'completed',
                quotaUnits: 2,
                estimatedQuotaUnits: 2,
                actualCost: 0,
                estimatedCost: 0,
                createdAt: new Date(),
            },
        ])

        await expect(assertAIQuotaAllowance({
            userId: 'user-1',
            category: 'text',
            type: 'translate',
            payload: { content: 'hello world' },
        })).rejects.toMatchObject({
            statusCode: 429,
        })
    })

    describe('quota policy resolution edge cases', () => {
        function mockQuotaPolicies(policies: unknown[] | string) {
            vi.mocked(getSetting).mockImplementation((key: string) => {
                const settingKey = String(key)

                if (settingKey === 'ai_quota_enabled') {
                    return Promise.resolve('true')
                }

                if (settingKey === 'ai_quota_policies') {
                    return Promise.resolve(typeof policies === 'string' ? policies : JSON.stringify(policies))
                }

                return Promise.resolve('[]')
            })
        }

        it('returns disabled results without querying repositories when quota is disabled or user is missing', async () => {
            vi.mocked(getSetting).mockResolvedValue('false')

            await expect(resolveAllAIQuotaPolicies({})).resolves.toEqual({ enabled: false, policies: [] })
            await expect(resolveAllAIQuotaPolicies({ userId: 'user-1' })).resolves.toEqual({ enabled: false, policies: [] })
            await expect(resolveAIQuotaPolicy({ type: 'summarize' })).resolves.toEqual({ enabled: false, policies: [] })
            await expect(assertAIQuotaAllowance({ type: 'summarize' })).resolves.toBeUndefined()
            await expect(assertAIQuotaAllowance({ userId: 'user-1', type: 'summarize' })).resolves.toBeUndefined()

            expect(mockTaskRepo.find).not.toHaveBeenCalled()
        })

        it('ignores policies when the stored policy payload is not a valid array', async () => {
            mockQuotaPolicies('{"not":"an-array"}')

            await expect(resolveAllAIQuotaPolicies({ userId: 'user-1' })).resolves.toEqual({
                enabled: true,
                policies: [],
            })
        })

        it('normalizes category scopes and matches type, category and global scopes', async () => {
            mockQuotaPolicies([
                {
                    subjectType: 'global',
                    subjectValue: 'default',
                    scope: 'type:summarize',
                    period: 'day',
                    maxRequests: 10,
                },
                {
                    subjectType: 'global',
                    subjectValue: 'default',
                    scope: 'image',
                    period: 'day',
                    maxQuotaUnits: 100,
                },
                {
                    subjectType: 'global',
                    subjectValue: 'default',
                    scope: 'text',
                    period: 'day',
                    maxActualCost: 5,
                },
                {
                    subjectType: 'global',
                    subjectValue: 'default',
                    scope: 'all',
                    period: 'month',
                    maxConcurrentHeavyTasks: 1,
                },
            ])

            const summarize = await resolveAIQuotaPolicy({
                userId: 'user-1',
                category: 'text',
                type: 'summarize',
            })
            expect(summarize.policies.map((policy) => [policy.scope, policy.period])).toEqual([
                ['type:summarize', 'day'],
                ['text', 'day'],
                ['all', 'month'],
            ])

            const image = await resolveAIQuotaPolicy({
                userId: 'user-1',
                category: 'image',
                type: 'image_generation',
            })
            expect(image.policies).toEqual([
                expect.objectContaining({ scope: 'image', maxQuotaUnits: 100 }),
                expect.objectContaining({ scope: 'all', maxConcurrentHeavyTasks: 1 }),
            ])

            const translate = await resolveAIQuotaPolicy({
                userId: 'user-1',
                category: 'text',
                type: 'translate',
            })
            expect(translate.policies).toEqual([
                expect.objectContaining({ scope: 'text', maxActualCost: 5 }),
                expect.objectContaining({ scope: 'all', maxConcurrentHeavyTasks: 1 }),
            ])
        })

        it('merges same-priority policies with the strictest numeric limits', async () => {
            mockQuotaPolicies([
                {
                    subjectType: 'global',
                    subjectValue: 'default',
                    scope: 'all',
                    period: 'day',
                    maxRequests: 10,
                    maxQuotaUnits: 20,
                    maxActualCost: 9,
                    maxConcurrentHeavyTasks: 3,
                },
                {
                    subjectType: 'global',
                    subjectValue: 'default',
                    scope: 'all',
                    period: 'day',
                    maxRequests: 8,
                    maxQuotaUnits: 30,
                    maxActualCost: 5,
                    maxConcurrentHeavyTasks: 2,
                },
            ])

            const result = await resolveAllAIQuotaPolicies({ userId: 'user-1' })

            expect(result.policies).toEqual([
                expect.objectContaining({
                    maxRequests: 8,
                    maxQuotaUnits: 20,
                    maxActualCost: 5,
                    maxConcurrentHeavyTasks: 2,
                }),
            ])
        })

        it('short-circuits merged limits when any policy is exempt', async () => {
            mockQuotaPolicies([
                {
                    subjectType: 'global',
                    subjectValue: 'default',
                    scope: 'all',
                    period: 'day',
                    maxRequests: 1,
                    isExempt: true,
                },
            ])

            const result = await resolveAllAIQuotaPolicies({ userId: 'user-1' })

            expect(result.policies).toHaveLength(1)
            expect(result.policies[0]).toMatchObject({ isExempt: true })
            expect(result.policies[0]?.maxRequests).toBeUndefined()
        })

        it('drops policies whose subject does not match the current user or role', async () => {
            mockQuotaPolicies([
                {
                    subjectType: 'role',
                    subjectValue: 'admin',
                    scope: 'all',
                    period: 'day',
                    maxRequests: 1,
                },
                {
                    subjectType: 'trust_level',
                    subjectValue: 'team-1',
                    scope: 'image',
                    period: 'day',
                    maxRequests: 1,
                },
            ])

            const result = await resolveAllAIQuotaPolicies({ userId: 'user-1' })

            expect(result.policies).toEqual([])
        })
    })

    describe('quota usage summarization and enforcement', () => {
        function mockQuotaPolicies(policies: unknown[]) {
            vi.mocked(getSetting).mockImplementation((key: string) => {
                const settingKey = String(key)

                if (settingKey === 'ai_quota_enabled') {
                    return Promise.resolve('true')
                }

                if (settingKey === 'ai_quota_policies') {
                    return Promise.resolve(JSON.stringify(policies))
                }

                return Promise.resolve('[]')
            })
        }

        it('starts monthly periods on the first day of the month', () => {
            const now = new Date('2026-11-08T12:00:00')

            expect(getPeriodStart('month', now).getDate()).toBe(1)
            expect(getPeriodStart('day', now).getHours()).toBe(0)
        })

        it('summarizes pending, completed and out-of-period tasks with heavy concurrency', () => {
            const now = new Date('2026-11-08T12:00:00')
            const result = summarizeAIQuotaUsage([
                {
                    category: 'text',
                    type: 'summarize',
                    status: 'pending',
                    quotaUnits: 10,
                    estimatedQuotaUnits: 2,
                    actualCost: 100,
                    estimatedCost: 3,
                    createdAt: new Date('2026-11-08T01:00:00'),
                },
                {
                    category: 'image',
                    type: 'image_generation',
                    status: 'processing',
                    quotaUnits: 0,
                    estimatedQuotaUnits: 5,
                    actualCost: 0,
                    estimatedCost: 1,
                    createdAt: new Date('2026-11-08T02:00:00'),
                },
                {
                    category: 'text',
                    type: 'translate',
                    status: 'completed',
                    quotaUnits: 4,
                    estimatedQuotaUnits: 9,
                    actualCost: 2,
                    estimatedCost: 9,
                    createdAt: new Date('2026-11-08T03:00:00'),
                },
                {
                    category: 'text',
                    type: 'translate',
                    status: 'completed',
                    quotaUnits: 40,
                    estimatedQuotaUnits: 40,
                    actualCost: 20,
                    estimatedCost: 20,
                    createdAt: new Date('2026-11-01T00:00:00'),
                },
            ], 'all', 'day', now)

            expect(result).toEqual({
                requests: 3,
                quotaUnits: 11,
                actualCost: 6,
                concurrentHeavyTasks: 1,
            })
        })

        it('rejects requests once the request limit is reached', async () => {
            mockQuotaPolicies([
                {
                    subjectType: 'global',
                    subjectValue: 'default',
                    scope: 'all',
                    period: 'day',
                    maxRequests: 1,
                },
            ])
            mockTaskRepo.find.mockResolvedValue([
                {
                    category: 'text',
                    type: 'summarize',
                    status: 'completed',
                    quotaUnits: 1,
                    actualCost: 0,
                    createdAt: new Date(),
                },
            ])

            await expect(assertAIQuotaAllowance({
                userId: 'user-1',
                category: 'text',
                type: 'summarize',
            })).rejects.toMatchObject({
                statusCode: 429,
                message: expect.stringContaining('request limit'),
            })
        })

        it('rejects requests once the actual cost limit would be exceeded', async () => {
            mockQuotaPolicies([
                {
                    subjectType: 'global',
                    subjectValue: 'default',
                    scope: 'all',
                    period: 'day',
                    maxActualCost: 1,
                },
            ])
            mockTaskRepo.find.mockResolvedValue([
                {
                    category: 'text',
                    type: 'summarize',
                    status: 'completed',
                    quotaUnits: 0,
                    actualCost: 2,
                    createdAt: new Date(),
                },
            ])

            await expect(assertAIQuotaAllowance({
                userId: 'user-1',
                category: 'text',
                type: 'summarize',
            })).rejects.toMatchObject({
                statusCode: 429,
                message: expect.stringContaining('cost limit'),
            })
        })

        it('rejects heavy tasks that exceed the concurrent limit', async () => {
            mockQuotaPolicies([
                {
                    subjectType: 'global',
                    subjectValue: 'default',
                    scope: 'all',
                    period: 'day',
                    maxConcurrentHeavyTasks: 1,
                },
            ])
            mockTaskRepo.find.mockResolvedValue([
                {
                    category: 'image',
                    type: 'image_generation',
                    status: 'pending',
                    quotaUnits: 0,
                    estimatedQuotaUnits: 1,
                    actualCost: 0,
                    estimatedCost: 1,
                    createdAt: new Date(),
                },
            ])

            await expect(assertAIQuotaAllowance({
                userId: 'user-1',
                category: 'image',
                type: 'image_generation',
            })).rejects.toMatchObject({
                statusCode: 429,
                message: 'AI quota exceeded: concurrent heavy task limit reached',
            })
        })

        it('skips exempt policies during enforcement', async () => {
            mockQuotaPolicies([
                {
                    subjectType: 'global',
                    subjectValue: 'default',
                    scope: 'all',
                    period: 'day',
                    maxRequests: 0,
                    isExempt: true,
                },
            ])

            await expect(assertAIQuotaAllowance({
                userId: 'user-1',
                category: 'text',
                type: 'summarize',
            })).resolves.toBeUndefined()
            expect(mockTaskRepo.find).not.toHaveBeenCalled()
        })

        it('uses an empty usage summary when the data source is not initialized', async () => {
            mockQuotaPolicies([
                {
                    subjectType: 'global',
                    subjectValue: 'default',
                    scope: 'all',
                    period: 'day',
                    maxRequests: 0,
                },
            ])
            ;(dataSource as any).isInitialized = false

            try {
                await expect(assertAIQuotaAllowance({
                    userId: 'user-1',
                    userRole: 'author',
                    category: 'text',
                    type: 'summarize',
                })).rejects.toMatchObject({
                    statusCode: 429,
                    message: expect.stringContaining('request limit'),
                })
                expect(mockTaskRepo.find).not.toHaveBeenCalled()
            } finally {
                ;(dataSource as any).isInitialized = true
            }
        })
    })
})
