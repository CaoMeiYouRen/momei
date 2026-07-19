import { describe, expect, it, vi } from 'vitest'
import { RateLimiter } from './rate-limiter'

describe('RateLimiter', () => {
    describe('execute', () => {
        it('should execute a function successfully', async () => {
            const limiter = new RateLimiter({ rps: 100, concurrency: 10, maxRetries: 0 })
            const fn = vi.fn().mockResolvedValue('ok')
            const result = await limiter.execute(fn)
            expect(result).toBe('ok')
            expect(fn).toHaveBeenCalledTimes(1)
        })

        it('should retry on 429 errors up to maxRetries times', async () => {
            const limiter = new RateLimiter({ rps: 100, concurrency: 10, maxRetries: 2, baseRetryDelayMs: 10 })

            const fn = vi.fn()
                .mockRejectedValueOnce(Object.assign(new Error('Too Many Requests'), { status: 429 }))
                .mockRejectedValueOnce(Object.assign(new Error('Too Many Requests'), { status: 429 }))
                .mockResolvedValue('ok')

            const result = await limiter.execute(fn)
            expect(result).toBe('ok')
            // 1 initial + 2 retries = 3 total calls
            expect(fn).toHaveBeenCalledTimes(3)
        }, 15000)

        it('should throw after exhausting retries', async () => {
            const limiter = new RateLimiter({ rps: 100, concurrency: 10, maxRetries: 1, baseRetryDelayMs: 10 })
            const fn = vi.fn().mockRejectedValue(Object.assign(new Error('Too Many Requests'), { status: 429 }))

            await expect(limiter.execute(fn)).rejects.toMatchObject({ status: 429 })
            // 1 initial + 1 retry = 2 total calls before throwing
            expect(fn).toHaveBeenCalledTimes(2)
        }, 15000)

        it('should not retry non-429 errors', async () => {
            const limiter = new RateLimiter({ rps: 100, concurrency: 10, maxRetries: 3, baseRetryDelayMs: 10 })
            const fn = vi.fn().mockRejectedValue(new Error('Bad Request'))

            await expect(limiter.execute(fn)).rejects.toThrow('Bad Request')
            expect(fn).toHaveBeenCalledTimes(1)
        })

        it('should limit concurrent requests', async () => {
            const limiter = new RateLimiter({ rps: 100, concurrency: 2, maxRetries: 0, baseRetryDelayMs: 10 })
            let concurrent = 0
            let maxConcurrent = 0

            const fn = vi.fn().mockImplementation(async () => {
                concurrent++
                maxConcurrent = Math.max(maxConcurrent, concurrent)
                await new Promise((resolve) => setTimeout(resolve, 50))
                concurrent--
                return 'ok'
            })

            const results = await Promise.all([
                limiter.execute(fn),
                limiter.execute(fn),
                limiter.execute(fn),
                limiter.execute(fn),
            ])

            expect(results).toEqual(['ok', 'ok', 'ok', 'ok'])
            // With concurrency=2 and 4 tasks, the rate limiter should ensure
            // at most 2 tasks run concurrently
            expect(maxConcurrent).toBeLessThanOrEqual(2)
            expect(fn).toHaveBeenCalledTimes(4)
        }, 15000)
    })
})
