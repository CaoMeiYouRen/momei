import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './send.post'
import { requireAdmin } from '@/server/utils/permission'
import { startMarketingCampaignDispatch } from '@/server/services/notification'

vi.mock('@/server/utils/permission')
vi.mock('@/server/services/notification', () => ({
    startMarketingCampaignDispatch: vi.fn(),
}))

const { getRouterParam, createError } = global as any

describe('POST /api/admin/marketing/campaigns/[id]/send', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        vi.mocked(requireAdmin).mockResolvedValue({
            user: { id: 'admin-1', role: 'admin' } as any,
            session: {} as any,
        })
    })

    it('should start sending campaign successfully', async () => {
        vi.mocked(startMarketingCampaignDispatch).mockResolvedValue({
            state: 'started',
            mode: 'email',
        })

        const mockEvent = {
            context: {
                params: { id: 'campaign-123' },
            },
        } as any

        vi.mocked(getRouterParam).mockReturnValue('campaign-123')

        const result = await handler(mockEvent)

        expect(result.code).toBe(200)
        expect(result.message).toBe('Campaign sending started')
        expect(startMarketingCampaignDispatch).toHaveBeenCalledWith('campaign-123')
    })

    it('should throw 404 for non-existent campaign', async () => {
        vi.mocked(startMarketingCampaignDispatch).mockResolvedValue({
            state: 'not_found',
            mode: 'email',
        })

        const mockEvent = {
            context: {
                params: { id: 'invalid-id' },
            },
        } as any

        vi.mocked(getRouterParam).mockReturnValue('invalid-id')

        await expect(handler(mockEvent)).rejects.toThrow('Campaign not found')
    })

    it('should reject already completed campaign', async () => {
        vi.mocked(startMarketingCampaignDispatch).mockResolvedValue({
            state: 'already_completed',
            mode: 'email',
        })

        const mockEvent = {
            context: {
                params: { id: 'campaign-123' },
            },
        } as any

        vi.mocked(getRouterParam).mockReturnValue('campaign-123')

        await expect(handler(mockEvent)).rejects.toThrow('Campaign already sent')
    })

    it('should reject already sending campaign', async () => {
        vi.mocked(startMarketingCampaignDispatch).mockResolvedValue({
            state: 'already_sending',
            mode: 'email',
        })

        const mockEvent = {
            context: {
                params: { id: 'campaign-456' },
            },
        } as any

        vi.mocked(getRouterParam).mockReturnValue('campaign-456')

        await expect(handler(mockEvent)).rejects.toThrow('Campaign is already sending')
    })

    it('should require admin permission', async () => {
        vi.mocked(requireAdmin).mockRejectedValue(
            createError({ statusCode: 403, statusMessage: 'Forbidden' }),
        )

        const mockEvent = {} as any

        await expect(handler(mockEvent)).rejects.toThrow('Forbidden')
    })
})
