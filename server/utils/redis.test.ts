import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface RedisClientMock {
    on: ReturnType<typeof vi.fn>
    set: ReturnType<typeof vi.fn>
    del: ReturnType<typeof vi.fn>
}

function createRedisClientMock(): RedisClientMock {
    return {
        on: vi.fn().mockReturnThis(),
        set: vi.fn().mockResolvedValue('OK'),
        del: vi.fn().mockResolvedValue(1),
    }
}

async function loadRedisModule(options?: {
    redisUrl?: string
    redisClient?: RedisClientMock
    throwOnConstruct?: boolean
}) {
    vi.resetModules()
    vi.doMock('@/utils/shared/env', () => ({
        REDIS_URL: options?.redisUrl,
    }))

    const redisClient = options?.redisClient ?? createRedisClientMock()
    const redisConstructor = vi.fn()

    class RedisMock {
        constructor(...args: unknown[]) {
            redisConstructor(...args)
            if (options?.throwOnConstruct) {
                throw new Error('redis_init_failed')
            }

            return redisClient
        }
    }

    vi.doMock('ioredis', () => ({
        Redis: RedisMock,
    }))

    const redisModule = await import('./redis')
    return {
        ...redisModule,
        redisClient,
        redisConstructor,
    }
}

afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.doUnmock('ioredis')
    vi.doUnmock('@/utils/shared/env')
})

describe('server/utils/redis', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('没有 REDIS_URL 时应回退为本地模式', async () => {
        const { getRedis, acquireLock, releaseLock, redisConstructor } = await loadRedisModule()

        expect(getRedis()).toBeNull()
        expect(redisConstructor).not.toHaveBeenCalled()
        await expect(acquireLock('lock-key')).resolves.toBe(true)
        await expect(releaseLock('lock-key')).resolves.toBeUndefined()
    })

    it('有 REDIS_URL 时应初始化 Redis 并注册错误监听', async () => {
        const { getRedis, redisClient, redisConstructor } = await loadRedisModule({
            redisUrl: 'redis://127.0.0.1:6379',
        })

        expect(redisConstructor).toHaveBeenCalledWith('redis://127.0.0.1:6379', {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        })
        expect(getRedis()).toBe(redisClient)
        expect(redisClient.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('分布式锁应根据 Redis 返回值决定是否成功，并在释放时调用 del', async () => {
        const redisClient = createRedisClientMock()
        redisClient.set.mockResolvedValueOnce('OK').mockResolvedValueOnce(null)

        const { acquireLock, releaseLock } = await loadRedisModule({
            redisUrl: 'redis://127.0.0.1:6379',
            redisClient,
        })

        await expect(acquireLock('lock-key', 5000)).resolves.toBe(true)
        expect(redisClient.set).toHaveBeenCalledWith('lock-key', 'locked', 'PX', 5000, 'NX')

        await expect(acquireLock('lock-key', 5000)).resolves.toBe(false)

        await releaseLock('lock-key')
        expect(redisClient.del).toHaveBeenCalledWith('lock-key')
    })

    it('初始化失败时应记录错误并保留空 Redis 实例', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            // mute expected error output
        })

        const { getRedis, acquireLock } = await loadRedisModule({
            redisUrl: 'redis://127.0.0.1:6379',
            throwOnConstruct: true,
        })

        expect(consoleErrorSpy).toHaveBeenCalledWith('[Redis] Failed to initialize:', expect.any(Error))
        expect(getRedis()).toBeNull()
        await expect(acquireLock('lock-key')).resolves.toBe(true)
    })
})
