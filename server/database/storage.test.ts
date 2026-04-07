import { afterEach, describe, expect, it, vi } from 'vitest'

interface RedisClientMock {
    get: ReturnType<typeof vi.fn>
    set: ReturnType<typeof vi.fn>
    del: ReturnType<typeof vi.fn>
    incr: ReturnType<typeof vi.fn>
    expire: ReturnType<typeof vi.fn>
}

const createRedisClientMock = (): RedisClientMock => ({
    get: vi.fn().mockResolvedValue('mock-value'),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
})

const loadStorageModule = async (options?: {
    redisUrl?: string
    redisClient?: RedisClientMock
}) => {
    vi.resetModules()
    vi.doMock('@/utils/shared/env', () => ({
        REDIS_URL: options?.redisUrl,
    }))

    const redisClient = options?.redisClient ?? createRedisClientMock()
    const redisConstructor = vi.fn()

    class RedisMock {
        constructor(...args: unknown[]) {
            redisConstructor(...args)
            return redisClient
        }
    }

    vi.doMock('ioredis', () => ({
        Redis: RedisMock,
    }))

    const storageModule = await import('./storage')
    return {
        ...storageModule,
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

describe('server/database/storage', () => {
    describe('Redis storage', () => {
        it('secondaryStorage 应该代理到 Redis 实现', async () => {
            const { secondaryStorage, redisClient, redisConstructor } = await loadStorageModule({
                redisUrl: 'redis://127.0.0.1:6379',
            })

            expect(redisConstructor).toHaveBeenCalledWith('redis://127.0.0.1:6379')
            expect(await secondaryStorage.get('test-key')).toBe('mock-value')
            expect(redisClient.get).toHaveBeenCalledWith('test-key')

            expect(await secondaryStorage.set('test-key', 'test-value', 60)).toBe('OK')
            expect(redisClient.set).toHaveBeenCalledWith('test-key', 'test-value', 'EX', 60)

            expect(await secondaryStorage.set('test-key', 'test-value')).toBe('OK')
            expect(redisClient.set).toHaveBeenCalledWith('test-key', 'test-value')

            expect(await secondaryStorage.delete('test-key')).toBeNull()
            expect(redisClient.del).toHaveBeenCalledWith('test-key')
        })

        it('limiterStorage 在首次 increment 时应该设置 ttl', async () => {
            const redisClient = createRedisClientMock()
            redisClient.incr.mockResolvedValueOnce(1)

            const { limiterStorage } = await loadStorageModule({
                redisUrl: 'redis://127.0.0.1:6379',
                redisClient,
            })

            await expect(limiterStorage.increment('test-key', 60)).resolves.toBe(1)
            expect(redisClient.incr).toHaveBeenCalledWith('test-key')
            expect(redisClient.expire).toHaveBeenCalledWith('test-key', 60)
        })

        it('limiterStorage 在计数器已存在时不应该重复设置 ttl', async () => {
            const redisClient = createRedisClientMock()
            redisClient.incr.mockResolvedValueOnce(2)

            const { limiterStorage } = await loadStorageModule({
                redisUrl: 'redis://127.0.0.1:6379',
                redisClient,
            })

            await expect(limiterStorage.increment('test-key', 60)).resolves.toBe(2)
            expect(redisClient.expire).not.toHaveBeenCalled()
        })
    })

    describe('memory fallback', () => {
        it('在没有 REDIS_URL 时应该使用内存存储并返回本地结果', async () => {
            const { secondaryStorage, limiterStorage, redisConstructor } = await loadStorageModule()

            expect(redisConstructor).not.toHaveBeenCalled()

            expect(await secondaryStorage.get('missing-key')).toBeNull()

            await expect(secondaryStorage.set('test-key', 'test-value', 60)).resolves.toBeNull()
            await expect(secondaryStorage.get('test-key')).resolves.toBe('test-value')

            await expect(secondaryStorage.delete('test-key')).resolves.toBeNull()
            await expect(secondaryStorage.get('test-key')).resolves.toBeNull()

            await expect(limiterStorage.increment('limit-key', 60)).resolves.toBe(1)
            await expect(limiterStorage.increment('limit-key', 60)).resolves.toBe(2)
            await expect(limiterStorage.get('limit-key')).resolves.toBe('2')
        })
    })
})
