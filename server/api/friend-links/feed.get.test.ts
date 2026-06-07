import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './feed.get'
import { getFriendLinkFeeds } from '@/server/services/friend-link-feed'
import { rateLimit } from '@/server/utils/rate-limit'
import { success } from '@/server/utils/response'

vi.mock('@/server/services/friend-link-feed')
vi.mock('@/server/utils/rate-limit')
vi.mock('@/server/utils/response')

describe('GET /api/friend-links/feed', () => {
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

        const result = await handler({} as any)

        expect(rateLimit).toHaveBeenCalledWith(expect.anything(), { window: 60, max: 30 })
        expect(getFriendLinkFeeds).toHaveBeenCalled()
        expect(success).toHaveBeenCalledWith(feedItems)
        expect(result).toEqual({ code: 200, data: feedItems })
    })

    it('returns empty array when no feeds available', async () => {
        vi.mocked(getFriendLinkFeeds).mockResolvedValue([])

        const result = await handler({} as any)

        expect(success).toHaveBeenCalledWith([])
        expect(result).toEqual({ code: 200, data: [] })
    })

    it('applies rate limit before fetching feeds', async () => {
        const order: string[] = []
        // eslint-disable-next-line @typescript-eslint/require-await
        vi.mocked(rateLimit).mockImplementation(async () => {
            order.push('rateLimit')
        })
        // eslint-disable-next-line @typescript-eslint/require-await
        vi.mocked(getFriendLinkFeeds).mockImplementation(async () => {
            order.push('getFeeds')
            return []
        })

        await handler({} as any)

        expect(order).toEqual(['rateLimit', 'getFeeds'])
    })
})
