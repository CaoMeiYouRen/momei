import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Redis } from 'ioredis'
import { buildPVHourlyBucketKey, pvCache, resolvePVBucketHourUtc } from './pv-cache'
import { isServerlessEnvironment } from './env'
import { Post } from '@/server/entities/post'
import { PostViewHourly } from '@/server/entities/post-view-hourly'
import { dataSource } from '@/server/database'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
        transaction: vi.fn(),
    },
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock('./env', () => ({
    isServerlessEnvironment: vi.fn(),
}))

vi.mock('ioredis', () => {
    class MockRedis {
        multi = vi.fn().mockReturnValue({
            incr: vi.fn().mockReturnThis(),
            sadd: vi.fn().mockReturnThis(),
            exec: vi.fn().mockResolvedValue([]),
        })

        get = vi.fn().mockResolvedValue('5')
        keys = vi.fn().mockResolvedValue(['momei:pv:1'])
        del = vi.fn().mockResolvedValue(1)
        exists = vi.fn().mockResolvedValue(1)
        rename = vi.fn().mockResolvedValue('OK')
        sadd = vi.fn().mockResolvedValue(1)
        smembers = vi.fn().mockResolvedValue(['post1'])
        getset = vi.fn().mockResolvedValue('10')
        srem = vi.fn().mockResolvedValue(1)
        incrby = vi.fn().mockResolvedValue(1)
        decrby = vi.fn().mockResolvedValue(0)
        set = vi.fn().mockResolvedValue('OK')
    }
    return {
        Redis: MockRedis,
    }
})

describe('PVCache - Extended Coverage', () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        await pvCache.clear()
        // @ts-expect-error test-internal
        pvCache.redis = null
    })

    describe('record', () => {
        it('should fallback if Redis fails', async () => {
            const mockRedis = new Redis()
            // @ts-expect-error test-internal
            mockRedis.multi = vi.fn(() => ({
                incr: vi.fn().mockReturnThis(),
                sadd: vi.fn().mockReturnThis(),
                exec: vi.fn().mockRejectedValue(new Error('Redis Error')),
            }))
            // @ts-expect-error test-internal
            pvCache.redis = mockRedis
            // 确保 Redis.get 不返回 5干扰测试 (mocked global Redis class)
            vi.mocked(mockRedis.get).mockResolvedValue(null)

            await pvCache.record('post-fallback')
            expect(await pvCache.getPending('post-fallback')).toBe(1)
        })

        it('should update DB directly in serverless environment if no Redis', async () => {
            vi.mocked(isServerlessEnvironment).mockReturnValue(true)
            const mockPostRepo = {
                increment: vi.fn().mockResolvedValue({ affected: 1 }),
            }
            const mockHourlyRepo = {
                increment: vi.fn().mockResolvedValue({ affected: 0 }),
                insert: vi.fn().mockResolvedValue({ identifiers: [] }),
            }
            const mockManager = {
                getRepository: vi.fn((entity: unknown) => {
                    if (entity === Post) {
                        return mockPostRepo
                    }

                    if (entity === PostViewHourly) {
                        return mockHourlyRepo
                    }

                    throw new Error('Unexpected repository request')
                }),
            }
            vi.mocked(dataSource.transaction).mockImplementation(async (callback: any) => await callback(mockManager))

            await pvCache.record('post-serverless')
            expect(mockPostRepo.increment).toHaveBeenCalledWith({ id: 'post-serverless' }, 'views', 1)
            expect(mockHourlyRepo.insert).toHaveBeenCalledWith(expect.objectContaining({
                postId: 'post-serverless',
                views: 1,
            }))
        })
    })

    it('should build stable hourly bucket keys', () => {
        const bucketHourUtc = resolvePVBucketHourUtc('2026-04-18T10:42:00+08:00')
        expect(bucketHourUtc).toBe('2026-04-18T02:00:00.000Z')
        expect(buildPVHourlyBucketKey('post-1', bucketHourUtc)).toBe('2026-04-18T02:00:00.000Z|post-1')
    })

    describe('getPending', () => {
        it('should merge data from Redis', async () => {
            const mockRedis = new Redis()
            vi.mocked(mockRedis.get).mockResolvedValue('15')
            // @ts-expect-error test-internal
            pvCache.redis = mockRedis

            // 手动填充内存缓存
            // @ts-expect-error test-internal
            pvCache.pendingByPost.set('post-mixed', 5)

            const pending = await pvCache.getPending('post-mixed')
            expect(pending).toBe(20)
        })

        it('should ignore Redis errors during getPending', async () => {
            const mockRedis = new Redis()
            vi.mocked(mockRedis.get).mockRejectedValue(new Error('Redis error'))
            // @ts-expect-error test-internal
            pvCache.redis = mockRedis

            // @ts-expect-error test-internal
            pvCache.pendingByPost.set('post-error-redis', 10)
            const pending = await pvCache.getPending('post-error-redis')
            expect(pending).toBe(10)
        })
    })

    describe('flush', () => {
        it('should merge hourly bucket data from Redis during flush', async () => {
            const mockRedis = new Redis()
            const bucketHourUtc = '2026-04-18T02:00:00.000Z'
            const bucketKey = buildPVHourlyBucketKey('post-redis', bucketHourUtc)
            vi.mocked(mockRedis.smembers).mockResolvedValue([bucketKey])
            vi.mocked(mockRedis.getset)
                .mockResolvedValueOnce('25')
                .mockResolvedValueOnce('25')
            // @ts-expect-error test-internal
            pvCache.redis = mockRedis

            const mockPostRepo = { increment: vi.fn().mockResolvedValue({ affected: 1 }) }
            const mockHourlyRepo = {
                increment: vi.fn().mockResolvedValue({ affected: 0 }),
                insert: vi.fn().mockResolvedValue({ identifiers: [] }),
            }
            const mockManager = {
                getRepository: vi.fn((entity: unknown) => {
                    if (entity === Post) {
                        return mockPostRepo
                    }

                    if (entity === PostViewHourly) {
                        return mockHourlyRepo
                    }

                    throw new Error('Unexpected repository request')
                }),
            }
            vi.mocked(dataSource.transaction).mockImplementation(async (callback: any) => await callback(mockManager))

            await pvCache.flush()
            expect(mockPostRepo.increment).toHaveBeenCalledWith({ id: 'post-redis' }, 'views', 25)
            expect(mockHourlyRepo.insert).toHaveBeenCalledWith(expect.objectContaining({
                postId: 'post-redis',
                views: 25,
            }))
            expect(mockRedis.rename).toHaveBeenCalledWith('momei:pv:pending_hourly_keys', 'momei:pv:pending_hourly_keys:processing')
            expect(mockRedis.decrby).toHaveBeenCalledWith('momei:pv:post:post-redis', 25)
        })

        it('should restore Redis buckets if persistence fails after capture', async () => {
            const mockRedis = new Redis()
            const bucketKey = buildPVHourlyBucketKey('post-restore', '2026-04-18T02:00:00.000Z')
            vi.mocked(mockRedis.smembers).mockResolvedValue([bucketKey])
            vi.mocked(mockRedis.getset).mockResolvedValue('6')
            // @ts-expect-error test-internal
            pvCache.redis = mockRedis

            vi.mocked(dataSource.transaction).mockRejectedValue(new Error('flush failed'))

            await pvCache.flush()

            expect(mockRedis.incrby).toHaveBeenCalledWith(`momei:pv:buf:${bucketKey}`, 6)
            expect(mockRedis.sadd).toHaveBeenCalledWith('momei:pv:pending_hourly_keys', bucketKey)
            expect(mockRedis.decrby).not.toHaveBeenCalled()
        })

        it('should not requeue Redis buckets if cleanup fails after a successful flush', async () => {
            const mockRedis = new Redis()
            const bucketKey = buildPVHourlyBucketKey('post-cleanup', '2026-04-18T02:00:00.000Z')
            vi.mocked(mockRedis.smembers).mockResolvedValue([bucketKey])
            vi.mocked(mockRedis.getset).mockResolvedValueOnce('4')
            vi.mocked(mockRedis.decrby).mockRejectedValue(new Error('cleanup failed'))
            // @ts-expect-error test-internal
            pvCache.redis = mockRedis

            const mockPostRepo = { increment: vi.fn().mockResolvedValue({ affected: 1 }) }
            const mockHourlyRepo = {
                increment: vi.fn().mockResolvedValue({ affected: 0 }),
                insert: vi.fn().mockResolvedValue({ identifiers: [] }),
            }
            const mockManager = {
                getRepository: vi.fn((entity: unknown) => {
                    if (entity === Post) {
                        return mockPostRepo
                    }

                    if (entity === PostViewHourly) {
                        return mockHourlyRepo
                    }

                    throw new Error('Unexpected repository request')
                }),
            }
            vi.mocked(dataSource.transaction).mockImplementation(async (callback: any) => await callback(mockManager))

            await pvCache.flush()

            expect(mockPostRepo.increment).toHaveBeenCalledWith({ id: 'post-cleanup' }, 'views', 4)
            expect(mockRedis.incrby).not.toHaveBeenCalledWith(`momei:pv:buf:${bucketKey}`, 4)
            expect(mockRedis.sadd).not.toHaveBeenCalledWith('momei:pv:pending_hourly_keys', bucketKey)
        })
    })

    describe('Edge Cases', () => {
        it('should skip hourly persistence if the post no longer exists', async () => {
            const mockPostRepo = { increment: vi.fn().mockResolvedValue({ affected: 0 }) }
            const mockHourlyRepo = {
                increment: vi.fn(),
                insert: vi.fn(),
            }
            const mockManager = {
                getRepository: vi.fn((entity: unknown) => {
                    if (entity === Post) {
                        return mockPostRepo
                    }

                    if (entity === PostViewHourly) {
                        return mockHourlyRepo
                    }

                    throw new Error('Unexpected repository request')
                }),
            }
            vi.mocked(dataSource.transaction).mockImplementation(async (callback: any) => await callback(mockManager))

            const bucketKey = buildPVHourlyBucketKey('missing-post', '2026-04-18T02:00:00.000Z')
            // @ts-expect-error test-internal
            pvCache.cache.set(bucketKey, 1)
            // @ts-expect-error test-internal
            pvCache.pendingByPost.set('missing-post', 1)
            await pvCache.flush()
            expect(mockPostRepo.increment).toHaveBeenCalled()
            expect(mockHourlyRepo.insert).not.toHaveBeenCalled()
        })
    })
})
