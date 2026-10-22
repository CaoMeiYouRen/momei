import { beforeEach, describe, expect, it, vi } from 'vitest'

const { warnMock } = vi.hoisted(() => ({
    warnMock: vi.fn(),
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        warn: warnMock,
        info: vi.fn(),
        error: vi.fn(),
    },
}))

import { fetchExternalFeedSource } from './fetcher'

describe('fetchExternalFeedSource', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns response text for successful request', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<rss></rss>')))

        const result = await fetchExternalFeedSource({
            id: 'feed-1',
            sourceUrl: 'https://example.com/rss.xml',
        } as never)

        expect(result).toBe('<rss></rss>')
    })

    it('classifies upstream 4xx failures', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })))

        await expect(fetchExternalFeedSource({
            id: 'feed-1',
            sourceUrl: 'https://example.com/rss.xml',
        } as never)).rejects.toMatchObject({
            category: 'upstream_4xx',
            httpStatus: 404,
        })
    })

    it('classifies upstream 5xx failures', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 502 })))

        await expect(fetchExternalFeedSource({
            id: 'feed-1',
            sourceUrl: 'https://example.com/rss.xml',
        } as never)).rejects.toMatchObject({
            category: 'upstream_error',
            httpStatus: 502,
        })
    })

    it('rejects brotli responses as network errors', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<rss></rss>', {
            headers: { 'content-encoding': 'br' },
        })))

        await expect(fetchExternalFeedSource({
            id: 'feed-1',
            sourceUrl: 'https://example.com/rss.xml',
        } as never)).rejects.toMatchObject({
            category: 'network_error',
            httpStatus: null,
        })
        expect(warnMock).toHaveBeenCalledOnce()
    })

    it('wraps network errors and logs warning', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('socket hang up')))

        await expect(fetchExternalFeedSource({
            id: 'feed-1',
            sourceUrl: 'https://example.com/rss.xml',
        } as never)).rejects.toMatchObject({
            category: 'network_error',
            httpStatus: null,
            message: 'socket hang up',
        })
        expect(warnMock).toHaveBeenCalledOnce()
    })
})
