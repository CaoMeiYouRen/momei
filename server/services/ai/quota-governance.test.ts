import { beforeEach, describe, expect, it, vi } from 'vitest'
import { assertAIQuotaAllowance, resolveAIQuotaPolicy } from './quota-governance'
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
})
