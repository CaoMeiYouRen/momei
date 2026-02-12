import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './send.post'
import { dataSource } from '@/server/database'
import { MarketingCampaign } from '@/server/entities/marketing-campaign'
import { Subscriber } from '@/server/entities/subscriber'
import { MarketingCampaignStatus } from '@/utils/shared/notification'
import * as emailUtils from '@/server/utils/email'
import { requireAdmin } from '@/server/utils/permission'

vi.mock('@/server/database')
vi.mock('@/server/utils/permission')
vi.mock('@/server/utils/email')
vi.mock('@/server/utils/logger')

describe('POST /api/admin/marketing/campaigns/[id]/send', () => {
    let mockCampaignRepo: any
    let mockSubscriberRepo: any

    beforeEach(() => {
        vi.clearAllMocks()

        mockCampaignRepo = {
            findOneBy: vi.fn(),
            save: vi.fn((campaign) => Promise.resolve(campaign)),
        }

        mockSubscriberRepo = {
            createQueryBuilder: vi.fn(() => ({
                where: vi.fn().mockReturnThis(),
                andWhere: vi.fn().mockReturnThis(),
                getMany: vi.fn().mockResolvedValue([]),
            })),
        }

        vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
            if (entity === MarketingCampaign) {
                return mockCampaignRepo
            }
            if (entity === Subscriber) {
                return mockSubscriberRepo
            }
            return {} as any
        })

        vi.mocked(requireAdmin).mockResolvedValue({
            user: { id: 'admin-1', role: 'admin' } as any,
            session: {} as any,
        } as any)
    })

    it('should start sending campaign successfully', async () => {
        const mockCampaign = {
            id: 'campaign-123',
            title: '测试推送',
            content: '<p>内容</p>',
            status: MarketingCampaignStatus.DRAFT,
            targetCriteria: {},
        }

        mockCampaignRepo.findOneBy.mockResolvedValue(mockCampaign)

        const mockEvent = {
            context: {
                params: { id: 'campaign-123' },
            },
        } as any

        vi.mocked(getRouterParam).mockReturnValue('campaign-123')

        const result = await handler(mockEvent)

        expect(result.code).toBe(200)
        expect(result.message).toBe('Campaign sending started')
        expect(mockCampaignRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                status: MarketingCampaignStatus.SENDING,
            }),
        )
    })

    it('should throw 404 for non-existent campaign', async () => {
        mockCampaignRepo.findOneBy.mockResolvedValue(null)

        const mockEvent = {
            context: {
                params: { id: 'invalid-id' },
            },
        } as any

        vi.mocked(getRouterParam).mockReturnValue('invalid-id')

        await expect(handler(mockEvent)).rejects.toThrow('Campaign not found')
    })

    it('should reject already completed campaign', async () => {
        const mockCampaign = {
            id: 'campaign-123',
            status: MarketingCampaignStatus.COMPLETED,
        }

        mockCampaignRepo.findOneBy.mockResolvedValue(mockCampaign)

        const mockEvent = {
            context: {
                params: { id: 'campaign-123' },
            },
        } as any

        vi.mocked(getRouterParam).mockReturnValue('campaign-123')

        await expect(handler(mockEvent)).rejects.toThrow('Campaign already sent')
    })

    it('should send emails to active subscribers', async () => {
        const mockCampaign = {
            id: 'campaign-123',
            title: '测试推送',
            content: '<p>内容</p>',
            status: MarketingCampaignStatus.DRAFT,
            targetCriteria: {},
        }

        const mockSubscribers = [
            { email: 'user1@example.com', isActive: true, isMarketingEnabled: true },
            { email: 'user2@example.com', isActive: true, isMarketingEnabled: true },
        ]

        mockCampaignRepo.findOneBy.mockResolvedValue(mockCampaign)

        const mockQueryBuilder = {
            where: vi.fn().mockReturnThis(),
            andWhere: vi.fn().mockReturnThis(),
            getMany: vi.fn().mockResolvedValue(mockSubscribers),
        }

        mockSubscriberRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)
        vi.mocked(emailUtils.sendEmail).mockResolvedValue(undefined)

        const mockEvent = {
            context: {
                params: { id: 'campaign-123' },
            },
        } as any

        vi.mocked(getRouterParam).mockReturnValue('campaign-123')

        await handler(mockEvent)

        // Wait for async sending
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(emailUtils.sendEmail).toHaveBeenCalledTimes(2)
        expect(emailUtils.sendEmail).toHaveBeenCalledWith({
            to: 'user1@example.com',
            subject: '测试推送',
            html: '<p>内容</p>',
        })
    })

    it('should filter subscribers by category criteria', async () => {
        const mockCampaign = {
            id: 'campaign-123',
            title: '分类推送',
            content: '<p>内容</p>',
            status: MarketingCampaignStatus.DRAFT,
            targetCriteria: {
                categoryIds: ['cat-1', 'cat-2'],
                tagIds: [],
            },
        }

        mockCampaignRepo.findOneBy.mockResolvedValue(mockCampaign)

        const mockQueryBuilder = {
            where: vi.fn().mockReturnThis(),
            andWhere: vi.fn().mockReturnThis(),
            getMany: vi.fn().mockResolvedValue([]),
        }

        mockSubscriberRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)

        const mockEvent = {
            context: {
                params: { id: 'campaign-123' },
            },
        } as any

        vi.mocked(getRouterParam).mockReturnValue('campaign-123')

        await handler(mockEvent)

        expect(mockQueryBuilder.andWhere).toHaveBeenCalled()
    })

    it('should handle email sending failures gracefully', async () => {
        const mockCampaign = {
            id: 'campaign-123',
            title: '测试推送',
            content: '<p>内容</p>',
            status: MarketingCampaignStatus.DRAFT,
            targetCriteria: {},
        }

        const mockSubscribers = [
            { email: 'user1@example.com', isActive: true, isMarketingEnabled: true },
            { email: 'user2@example.com', isActive: true, isMarketingEnabled: true },
        ]

        mockCampaignRepo.findOneBy.mockResolvedValue(mockCampaign)

        const mockQueryBuilder = {
            where: vi.fn().mockReturnThis(),
            andWhere: vi.fn().mockReturnThis(),
            getMany: vi.fn().mockResolvedValue(mockSubscribers),
        }

        mockSubscriberRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)

        vi.mocked(emailUtils.sendEmail)
            .mockResolvedValueOnce(undefined)
            .mockRejectedValueOnce(new Error('SMTP error'))

        const mockEvent = {
            context: {
                params: { id: 'campaign-123' },
            },
        } as any

        vi.mocked(getRouterParam).mockReturnValue('campaign-123')

        await handler(mockEvent)

        // Wait for async sending
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Should still mark as completed even if some emails fail
        expect(mockCampaignRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                status: MarketingCampaignStatus.COMPLETED,
            }),
        )
    })

    it('should mark campaign as failed on critical error', async () => {
        const mockCampaign = {
            id: 'campaign-123',
            title: '测试推送',
            content: '<p>内容</p>',
            status: MarketingCampaignStatus.DRAFT,
            targetCriteria: {},
        }

        mockCampaignRepo.findOneBy.mockResolvedValue(mockCampaign)
        mockSubscriberRepo.createQueryBuilder.mockImplementation(() => {
            throw new Error('Database connection lost')
        })

        const mockEvent = {
            context: {
                params: { id: 'campaign-123' },
            },
        } as any

        vi.mocked(getRouterParam).mockReturnValue('campaign-123')

        await handler(mockEvent)

        // Wait for async error handling
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(mockCampaignRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                status: MarketingCampaignStatus.FAILED,
            }),
        )
    })

    it('should require admin permission', async () => {
        vi.mocked(requireAdmin).mockRejectedValue(
            createError({ statusCode: 403, statusMessage: 'Forbidden' }),
        )

        const mockEvent = {} as any

        await expect(handler(mockEvent)).rejects.toThrow('Forbidden')
    })

    it('should set sentAt timestamp on completion', async () => {
        const mockCampaign = {
            id: 'campaign-123',
            title: '测试推送',
            content: '<p>内容</p>',
            status: MarketingCampaignStatus.DRAFT,
            targetCriteria: {},
        }

        mockCampaignRepo.findOneBy.mockResolvedValue(mockCampaign)

        const mockQueryBuilder = {
            where: vi.fn().mockReturnThis(),
            andWhere: vi.fn().mockReturnThis(),
            getMany: vi.fn().mockResolvedValue([]),
        }

        mockSubscriberRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)

        const mockEvent = {
            context: {
                params: { id: 'campaign-123' },
            },
        } as any

        vi.mocked(getRouterParam).mockReturnValue('campaign-123')

        await handler(mockEvent)

        // Wait for async completion
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(mockCampaignRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                status: MarketingCampaignStatus.COMPLETED,
                sentAt: expect.any(Date),
            }),
        )
    })
})
