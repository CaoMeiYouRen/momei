import { beforeEach, describe, expect, it, vi } from 'vitest'
import homeHandler from '@/server/api/external-feed/home.get'

vi.mock('~/server/utils/locale', () => ({
    AUTH_DEFAULT_LOCALE: 'en-US',
    detectRequestAuthLocale: vi.fn(() => 'en-US'),
    mapAuthLocaleToAppLocale: vi.fn(() => 'en-US'),
}))

vi.mock('@/server/services/external-feed/aggregator', () => ({
    getExternalFeedHomePayload: vi.fn(),
}))

import { getExternalFeedHomePayload } from '@/server/services/external-feed/aggregator'

describe('GET /api/external-feed/home', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns normalized home payload', async () => {
        vi.mocked(getExternalFeedHomePayload).mockResolvedValue({
            items: [],
            degraded: false,
            stale: false,
            fetchedAt: null,
            sourceCount: 0,
        })

        const result = await homeHandler({} as never)

        expect(result.code).toBe(200)
        expect(result.data).toEqual({
            items: [],
            degraded: false,
            stale: false,
            fetchedAt: null,
            sourceCount: 0,
        })
        expect(result.locale).toBe('en-US')
    })
})
