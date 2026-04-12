import { afterEach, describe, expect, it, vi } from 'vitest'
import { withAITimeout } from './timeout'

describe('withAITimeout', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('returns operation result before timeout', async () => {
        await expect(withAITimeout(Promise.resolve('ok'), 'task', 50)).resolves.toBe('ok')
    })

    it('throws 504 error when operation exceeds timeout', async () => {
        vi.useFakeTimers()

        const pendingOperation = new Promise<string>(() => {})
        const promise = withAITimeout(pendingOperation, 'heavy-task', 25)
        void promise.catch(() => {})

        await vi.advanceTimersByTimeAsync(25)

        await expect(promise).rejects.toMatchObject({
            statusCode: 504,
            message: 'heavy-task timeout (25ms)',
        })
    })

    it('clears timeout when operation resolves after a short delay', async () => {
        vi.useFakeTimers()

        const operation = new Promise<string>((resolve) => {
            setTimeout(() => resolve('done'), 10)
        })

        const promise = withAITimeout(operation, 'delayed-task', 50)
        await vi.advanceTimersByTimeAsync(10)

        await expect(promise).resolves.toBe('done')
    })
})
