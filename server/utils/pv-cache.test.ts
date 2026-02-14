import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pvCache } from './pv-cache'
import { dataSource } from '@/server/database'
import { isServerlessEnvironment } from './env'
import { Redis } from 'ioredis'

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
        smembers = vi.fn().mockResolvedValue(['post1'])
        getset = vi.fn().mockResolvedValue('10')
        srem = vi.fn().mockResolvedValue(1)
    }
    return {
        Redis: MockRedis,
    }
})

describe('PVCache - Extended Coverage', () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        await pvCache.clear()
        // @ts-ignore
        pvCache.redis = null
    })

    describe('record', () => {
        it('should fallback if Redis fails', async () => {
            const mockRedis = new Redis()
            // @ts-ignore
            mockRedis.multi = vi.fn(() => ({
                incr: vi.fn().mockReturnThis(),
                sadd: vi.fn().mockReturnThis(),
                exec: vi.fn().mockRejectedValue(new Error('Redis Error')),
            }))
            // @ts-ignore
            pvCache.redis = mockRedis
            // 确保 Redis.get 不返回 5干扰测试 (mocked global Redis class)
            vi.mocked(mockRedis.get).mockResolvedValue(null)
            
            await pvCache.record('post-fallback')
            expect(await pvCache.getPending('post-fallback')).toBe(1)
        })

        it('should update DB directly in serverless environment if no Redis', async () => {
            vi.mocked(isServerlessEnvironment).mockReturnValue(true)
            const mockRepo = {
                increment: vi.fn().mockResolvedValue({ affected: 1 }),
            }
            vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)
            
            await pvCache.record('post-serverless')
            expect(mockRepo.increment).toHaveBeenCalled()
        })
    })

    describe('getPending', () => {
        it('should merge data from Redis', async () => {
            const mockRedis = new Redis()
            vi.mocked(mockRedis.get).mockResolvedValue('15')
            // @ts-ignore
            pvCache.redis = mockRedis
            
            // 手动填充内存缓存
            // @ts-ignore
            pvCache.cache.set('post-mixed', 5)
            
            const pending = await pvCache.getPending('post-mixed')
            expect(pending).toBe(20)
        })

        it('should ignore Redis errors during getPending', async () => {
            const mockRedis = new Redis()
            vi.mocked(mockRedis.get).mockRejectedValue(new Error('Redis error'))
            // @ts-ignore
            pvCache.redis = mockRedis
            
            // @ts-ignore
            pvCache.cache.set('post-error-redis', 10)
            const pending = await pvCache.getPending('post-error-redis')
            expect(pending).toBe(10)
        })
    })

    describe('flush', () => {
        it('should merge data from Redis during flush', async () => {
            const mockRedis = new Redis()
            vi.mocked(mockRedis.smembers).mockResolvedValue(['post-redis'])
            vi.mocked(mockRedis.getset).mockResolvedValue('25')
            // @ts-ignore
            pvCache.redis = mockRedis

            const mockRepo = { increment: vi.fn().mockResolvedValue({ affected: 1 }) }
            const mockManager = { getRepository: vi.fn().mockReturnValue(mockRepo) }
            vi.mocked(dataSource.transaction).mockImplementation(async (callback: any) => await callback(mockManager))

            await pvCache.flush()
            expect(mockRepo.increment).toHaveBeenCalledWith({ id: 'post-redis' }, 'views', 25)
        })
    })

    describe('Edge Cases', () => {
        it('should handle increment returning affected 0', async () => {
            const mockRepo = { increment: vi.fn().mockResolvedValue({ affected: 0 }) }
            const mockManager = { getRepository: vi.fn().mockReturnValue(mockRepo) }
            vi.mocked(dataSource.transaction).mockImplementation(async (callback: any) => await callback(mockManager))
            
            // @ts-ignore
            pvCache.cache.set('missing-post', 1)
            await pvCache.flush()
            expect(mockRepo.increment).toHaveBeenCalled()
        })
    })
})