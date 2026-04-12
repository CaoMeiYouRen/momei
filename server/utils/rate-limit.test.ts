import { beforeEach, describe, expect, it, vi } from 'vitest'

const { incrementMock } = vi.hoisted(() => ({
    incrementMock: vi.fn(),
}))

vi.mock('@/server/database/storage', () => ({
    limiterStorage: {
        increment: incrementMock,
    },
}))

vi.stubGlobal('getRequestIP', vi.fn())

import { rateLimit } from './rate-limit'

describe('rateLimit', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('uses request ip and path to increment rate limit key', async () => {
        vi.mocked(getRequestIP).mockReturnValue('127.0.0.1')
        incrementMock.mockResolvedValue(2)

        await expect(rateLimit({ path: '/api/demo' } as never, { window: 60, max: 3 })).resolves.toBeUndefined()
        expect(incrementMock).toHaveBeenCalledWith('ratelimit:127.0.0.1:/api/demo', 60)
    })

    it('falls back to unknown ip', async () => {
        vi.mocked(getRequestIP).mockReturnValue(undefined)
        incrementMock.mockResolvedValue(1)

        await rateLimit({ path: '/api/demo' } as never, { window: 60, max: 2 })

        expect(incrementMock).toHaveBeenCalledWith('ratelimit:unknown:/api/demo', 60)
    })

    it('throws 429 when count exceeds max', async () => {
        vi.mocked(getRequestIP).mockReturnValue('127.0.0.1')
        incrementMock.mockResolvedValue(5)

        await expect(rateLimit({ path: '/api/demo' } as never, { window: 60, max: 3 })).rejects.toMatchObject({
            statusCode: 429,
            message: '请求过于频繁，请稍后再试',
        })
    })
})
