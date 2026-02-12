import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './campaigns.post'
import { dataSource } from '@/server/database'
import { MarketingCampaignStatus, MarketingCampaignType } from '@/utils/shared/notification'
import { requireAdmin } from '@/server/utils/permission'

vi.mock('@/server/database')
vi.mock('@/server/utils/permission')
vi.mock('h3', async () => {
    const actual = await vi.importActual('h3')
    return {
        ...actual,
        readValidatedBody: vi.fn(),
    }
})

const { readValidatedBody, createError } = await import('h3')

describe('POST /api/admin/marketing/campaigns', () => {
    let mockRepo: any

    beforeEach(() => {
        vi.clearAllMocks()

        mockRepo = {
            create: vi.fn(),
            save: vi.fn((campaign) => Promise.resolve({ ...campaign, id: 'campaign-123' })),
        }

        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo)
        vi.mocked(requireAdmin).mockResolvedValue({
            user: { id: 'admin-1', role: 'admin' } as any,
            session: {} as any,
        } as any)
    })

    it('should create draft campaign successfully', async () => {
        const mockEvent = {
            context: {
                session: {
                    user: { id: 'admin-1', role: 'admin' },
                },
            },
        } as any

        const mockBody = {
            title: '新功能发布',
            content: '<p>我们发布了新功能</p>',
            type: MarketingCampaignType.FEATURE,
            targetCriteria: {
                categoryIds: ['cat-1'],
                tagIds: ['tag-1'],
            },
        }

        vi.mocked(readValidatedBody).mockResolvedValue(mockBody)

        const result = await handler(mockEvent)

        expect(result.code).toBe(201)
        expect(result.message).toBe('Campaign created successfully')
        expect(mockRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                title: '新功能发布',
                status: MarketingCampaignStatus.DRAFT,
                senderId: 'admin-1',
            }),
        )
    })

    it('should create scheduled campaign with scheduledAt', async () => {
        const mockEvent = {
            context: {
                session: {
                    user: { id: 'admin-1', role: 'admin' },
                },
            },
        } as any

        const scheduledAt = new Date('2026-03-01T10:00:00Z')
        const mockBody = {
            title: '定时推送',
            content: '<p>内容</p>',
            type: MarketingCampaignType.FEATURE,
            scheduledAt: scheduledAt.toISOString(),
        }

        vi.mocked(readValidatedBody).mockResolvedValue(mockBody)

        const result = await handler(mockEvent)

        expect(result.code).toBe(201)
        expect(mockRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                status: MarketingCampaignStatus.SCHEDULED,
                scheduledAt: expect.any(Date),
            }),
        )
    })

    it('should reject invalid campaign data', async () => {
        const mockEvent = {
            context: {
                session: {
                    user: { id: 'admin-1', role: 'admin' },
                },
            },
        } as any

        const mockBody = {
            title: '', // Invalid: empty title
            content: '<p>内容</p>',
        }

        vi.mocked(readValidatedBody).mockImplementation((_event, validator) => {
            const result = validator(mockBody) as any
            if (!result.success) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Bad Request',
                    data: result.error.issues,
                })
            }
            return Promise.resolve(result.data)
        })

        await expect(handler(mockEvent)).rejects.toThrow()
    })

    it('should require admin permission', async () => {
        const mockEvent = {} as any

        vi.mocked(requireAdmin).mockRejectedValue(
            createError({ statusCode: 403, statusMessage: 'Forbidden' }),
        )

        await expect(handler(mockEvent)).rejects.toThrow('Forbidden')
    })

    it('should handle different campaign types', async () => {
        const mockEvent = {
            context: {
                session: {
                    user: { id: 'admin-1', role: 'admin' },
                },
            },
        } as any

        const types = [
            MarketingCampaignType.FEATURE,
            MarketingCampaignType.UPDATE,
            MarketingCampaignType.PROMOTION,
        ]

        for (const type of types) {
            const mockBody = {
                title: `Campaign ${type}`,
                content: '<p>Content</p>',
                type,
            }

            vi.mocked(readValidatedBody).mockResolvedValue(mockBody)

            const result = await handler(mockEvent)

            expect(result.code).toBe(201)
            expect(mockRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    type,
                }),
            )
        }
    })

    it('should handle targetCriteria with empty arrays', async () => {
        const mockEvent = {
            context: {
                session: {
                    user: { id: 'admin-1', role: 'admin' },
                },
            },
        } as any

        const mockBody = {
            title: '全员推送',
            content: '<p>内容</p>',
            targetCriteria: {
                categoryIds: [],
                tagIds: [],
            },
        }

        vi.mocked(readValidatedBody).mockResolvedValue(mockBody)

        const result = await handler(mockEvent)

        expect(result.code).toBe(201)
        expect(mockRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                targetCriteria: {
                    categoryIds: [],
                    tagIds: [],
                },
            }),
        )
    })
})
