import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './cancel.post'
import { dataSource } from '@/server/database'
import { requireAdmin } from '@/server/utils/permission'
import { MarketingCampaignStatus } from '@/utils/shared/notification'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdmin: vi.fn(),
}))

const { getRouterParam, createError } = global as any

describe('POST /api/admin/marketing/campaigns/[id]/cancel', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdmin).mockResolvedValue({
            user: { id: 'admin-1', role: 'admin' },
        } as any)
    })

    it('should cancel scheduled campaign successfully', async () => {
        const campaign = {
            id: 'campaign-1',
            status: MarketingCampaignStatus.SCHEDULED,
            scheduledAt: new Date('2026-06-20T10:00:00.000Z'),
        }
        const save = vi.fn().mockResolvedValue(undefined)
        const findOne = vi.fn().mockResolvedValue(campaign)

        vi.mocked(dataSource.getRepository).mockReturnValue({
            findOne,
            save,
        } as any)
        vi.mocked(getRouterParam).mockReturnValue('campaign-1')

        const result = await handler({} as any)

        expect(campaign.status).toBe(MarketingCampaignStatus.DRAFT)
        expect(campaign.scheduledAt).toBeNull()
        expect(save).toHaveBeenCalledWith(campaign)
        expect(result).toEqual({
            code: 200,
            message: 'Campaign schedule cancelled successfully',
            data: campaign,
        })
    })

    it('should return 404 when campaign does not exist', async () => {
        const findOne = vi.fn().mockResolvedValue(null)
        vi.mocked(dataSource.getRepository).mockReturnValue({ findOne } as any)
        vi.mocked(getRouterParam).mockReturnValue('campaign-404')

        await expect(handler({} as any)).rejects.toThrow('Campaign not found')
    })

    it('should reject cancelling sending campaign', async () => {
        const findOne = vi.fn().mockResolvedValue({
            id: 'campaign-sending',
            status: MarketingCampaignStatus.SENDING,
        })
        vi.mocked(dataSource.getRepository).mockReturnValue({ findOne } as any)
        vi.mocked(getRouterParam).mockReturnValue('campaign-sending')

        await expect(handler({} as any)).rejects.toThrow('Cannot cancel a campaign that is currently sending')
    })

    it('should reject cancelling completed campaign', async () => {
        const findOne = vi.fn().mockResolvedValue({
            id: 'campaign-completed',
            status: MarketingCampaignStatus.COMPLETED,
        })
        vi.mocked(dataSource.getRepository).mockReturnValue({ findOne } as any)
        vi.mocked(getRouterParam).mockReturnValue('campaign-completed')

        await expect(handler({} as any)).rejects.toThrow('Cannot cancel a campaign that has already completed')
    })

    it('should reject campaigns that are not scheduled', async () => {
        const findOne = vi.fn().mockResolvedValue({
            id: 'campaign-draft',
            status: MarketingCampaignStatus.DRAFT,
        })
        vi.mocked(dataSource.getRepository).mockReturnValue({ findOne } as any)
        vi.mocked(getRouterParam).mockReturnValue('campaign-draft')

        await expect(handler({} as any)).rejects.toThrow('Campaign is not scheduled')
    })

    it('should require admin permission', async () => {
        vi.mocked(requireAdmin).mockRejectedValue(
            createError({ statusCode: 403, statusMessage: 'Forbidden' }),
        )

        await expect(handler({} as any)).rejects.toThrow('Forbidden')
    })
})
