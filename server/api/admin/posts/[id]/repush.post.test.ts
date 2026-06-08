import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './repush.post'
import { createCampaignFromPost, startMarketingCampaignDispatch } from '@/server/services/notification'
import { requireAdmin } from '@/server/utils/permission'
import { MarketingCampaignStatus } from '@/utils/shared/notification'

vi.mock('@/server/utils/permission')
vi.mock('@/server/services/notification', () => ({
    createCampaignFromPost: vi.fn(),
    startMarketingCampaignDispatch: vi.fn(),
}))

const { getRouterParam, readValidatedBody } = global as any

describe('POST /api/admin/posts/[id]/repush', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(requireAdmin).mockResolvedValue({
            user: { id: 'admin-1', role: 'admin' } as any,
            session: {} as any,
        })
        vi.mocked(getRouterParam).mockReturnValue('post-1')
        vi.mocked(readValidatedBody).mockImplementation(async (_event, validator) => await validator({}))
        vi.mocked(createCampaignFromPost).mockResolvedValue({ id: 'campaign-1' } as any)
        vi.mocked(startMarketingCampaignDispatch).mockResolvedValue({
            state: 'started',
            mode: 'email',
        })
    })

    it('starts sending immediately by default', async () => {
        const result = await handler({} as any)

        expect(result.code).toBe(200)
        expect(result.message).toBe('Repush task started')
        expect(createCampaignFromPost).toHaveBeenCalledWith(
            'post-1',
            'admin-1',
            MarketingCampaignStatus.SENDING,
            undefined,
            null,
        )
        expect(startMarketingCampaignDispatch).toHaveBeenCalledWith('campaign-1')
    })

    it('creates draft campaign without dispatch when pushOption=draft', async () => {
        vi.mocked(readValidatedBody).mockImplementation(async (_event, validator) => await validator({
            pushOption: 'draft',
            pushCriteria: { categoryIds: ['cat-1'] },
        }))

        const result = await handler({} as any)

        expect(result.message).toBe('Repush draft created')
        expect(createCampaignFromPost).toHaveBeenCalledWith(
            'post-1',
            'admin-1',
            MarketingCampaignStatus.DRAFT,
            { categoryIds: ['cat-1'] },
            null,
        )
        expect(startMarketingCampaignDispatch).not.toHaveBeenCalled()
    })

    it('creates scheduled campaign when publish time is in the future', async () => {
        const futureDate = new Date(Date.now() + 60 * 60 * 1000)
        vi.mocked(readValidatedBody).mockImplementation(async (_event, validator) => await validator({
            pushOption: 'now',
            publishedAt: futureDate.toISOString(),
        }))

        const result = await handler({} as any)

        expect(result.message).toBe('Repush campaign scheduled')
        expect(createCampaignFromPost).toHaveBeenCalledWith(
            'post-1',
            'admin-1',
            MarketingCampaignStatus.SCHEDULED,
            undefined,
            expect.any(Date),
        )
        expect(startMarketingCampaignDispatch).not.toHaveBeenCalled()
    })

    it('skips campaign creation when pushOption=none', async () => {
        vi.mocked(readValidatedBody).mockImplementation(async (_event, validator) => await validator({
            pushOption: 'none',
        }))

        const result = await handler({} as any)

        expect(result.message).toBe('Repush skipped')
        expect(createCampaignFromPost).not.toHaveBeenCalled()
        expect(startMarketingCampaignDispatch).not.toHaveBeenCalled()
    })

    it('returns 400 when post id is missing', async () => {
        vi.mocked(getRouterParam).mockReturnValue(undefined)

        await expect(handler({} as any)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Post ID is required',
        })
        expect(createCampaignFromPost).not.toHaveBeenCalled()
    })

    it('returns 400 when request body validation fails', async () => {
        vi.mocked(readValidatedBody).mockImplementation(async (_event, validator) => await validator({
            pushOption: 'invalid',
        } as any))

        await expect(handler({} as any)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Bad Request',
        })
        expect(createCampaignFromPost).not.toHaveBeenCalled()
    })

    it('does not fail repush when async dispatch throws', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        vi.mocked(startMarketingCampaignDispatch).mockRejectedValue(new Error('dispatch failed'))

        const result = await handler({} as any)
        await Promise.resolve()

        expect(result.message).toBe('Repush task started')
        expect(startMarketingCampaignDispatch).toHaveBeenCalledWith('campaign-1')
        expect(consoleErrorSpy).toHaveBeenCalled()

        consoleErrorSpy.mockRestore()
    })
})
