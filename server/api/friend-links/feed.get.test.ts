import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './feed.get'
import { getFriendLinkFeeds } from '@/server/services/friend-link-feed'
import { rateLimit } from '@/server/utils/rate-limit'
import { success } from '@/server/utils/response'

vi.mock('@/server/services/friend-link-feed')
vi.mock('@/server/utils/rate-limit')
vi.mock('@/server/utils/response')

describe('GET /api/friend-links/feed', () => {
    const mockEvent = {} as Parameters<typeof handler>[0]

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(success).mockImplementation((data: unknown, statusCode?: number) => ({
            code: statusCode || 200,
            data,
        }))
    })

    it('returns feed items on success', async () => {
        const feedItems = [
            { title: 'Post One', url: 'https://example.com/1', publishedAt: '2025-06-02T10:00:00.000Z', siteName: 'Test Blog', siteUrl: 'https://example.com' },
        ]
        vi.mocked(getFriendLinkFeeds).mockResolvedValue(feedItems)

        const result = await handler(mockEvent)

        expect(rateLimit).toHaveBeenCalledWith(expect.anything(), { window: 60, max: 30 })
        expect(getFriendLinkFeeds).toHaveBeenCalled()
        expect(success).toHaveBeenCalledWith(feedItems)
        expect(result).toEqual({ code: 200, data: feedItems })
    })

    it('returns empty array when no feeds available', async () => {
        vi.mocked(getFriendLinkFeeds).mockResolvedValue([])

        const result = await handler(mockEvent)

        expect(success).toHaveBeenCalledWith([])
        expect(result).toEqual({ code: 200, data: [] })
    })

    it('applies rate limit before fetching feeds', async () => {
        const order: string[] = []
        vi.mocked(rateLimit).mockImplementation(() => {
            order.push('rateLimit')
            return Promise.resolve()
        })
        vi.mocked(getFriendLinkFeeds).mockImplementation(() => {
            order.push('getFeeds')
            return Promise.resolve([])
        })

        await handler(mockEvent)

        expect(order).toEqual(['rateLimit', 'getFeeds'])
    })
})
