import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pvCache } from './pv-cache'
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

describe('PVCache', () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        await pvCache.clear()
    })

    it('should record PVs', async () => {
        await pvCache.record('post1')
        await pvCache.record('post1')
        await pvCache.record('post2')

        expect(await pvCache.getPending('post1')).toBe(2)
        expect(await pvCache.getPending('post2')).toBe(1)
        expect(await pvCache.getPending('post3')).toBe(0)
    })

    it('should flush PVs to database', async () => {
        const mockRepo = {
            increment: vi.fn().mockResolvedValue({ affected: 1 }),
        }
        const mockManager = {
            getRepository: vi.fn().mockReturnValue(mockRepo),
        }

        // 模拟事务执行
        vi.mocked(dataSource.transaction).mockImplementation(async (callback: any) => await callback(mockManager))

        await pvCache.record('post-a')
        await pvCache.record('post-a')
        await pvCache.record('post-b')

        await pvCache.flush()

        expect(dataSource.transaction).toHaveBeenCalled()
        expect(mockManager.getRepository).toHaveBeenCalled()
        expect(mockRepo.increment).toHaveBeenCalledWith({ id: 'post-a' }, 'views', 2)
        expect(mockRepo.increment).toHaveBeenCalledWith({ id: 'post-b' }, 'views', 1)

        // 刷新后缓存应清空
        expect(await pvCache.getPending('post-a')).toBe(0)
        expect(await pvCache.getPending('post-b')).toBe(0)
    })

    it('should not flush if cache is empty', async () => {
        await pvCache.flush()
        expect(dataSource.transaction).not.toHaveBeenCalled()
    })

    it('should prevent concurrent flushes', async () => {
        // 设置一个永远不完成的事务
        vi.mocked(dataSource.transaction).mockReturnValue(new Promise(() => {
            // 不调用 resolve 以模拟挂起的事务
        }))

        await pvCache.record('post-a')

        // 第一次 flush
        void pvCache.flush()

        // 第二次 flush 应该直接返回（因为 isFlushPending 为 true）
        await pvCache.flush()

        expect(dataSource.transaction).toHaveBeenCalledTimes(1)
    })

    it('should handle flush errors gracefully', async () => {
        const mockRepo = {
            increment: vi.fn().mockRejectedValue(new Error('Database error')),
        }
        const mockManager = {
            getRepository: vi.fn().mockReturnValue(mockRepo),
        }

        vi.mocked(dataSource.transaction).mockImplementation(async (callback: any) => await callback(mockManager))

        await pvCache.record('post-error')
        await pvCache.flush()

        // 即使出错，isFlushPending 也应该被重置
        expect(dataSource.transaction).toHaveBeenCalled()
    })

    it('should handle post not found during flush', async () => {
        const mockRepo = {
            increment: vi.fn().mockResolvedValue({ affected: 0 }),
        }
        const mockManager = {
            getRepository: vi.fn().mockReturnValue(mockRepo),
        }

        vi.mocked(dataSource.transaction).mockImplementation(async (callback: any) => await callback(mockManager))

        await pvCache.record('non-existent-post')
        await pvCache.flush()

        expect(mockRepo.increment).toHaveBeenCalledWith({ id: 'non-existent-post' }, 'views', 1)
    })

    it('should accumulate multiple records for the same post', async () => {
        await pvCache.record('post-multi')
        await pvCache.record('post-multi')
        await pvCache.record('post-multi')
        await pvCache.record('post-multi')
        await pvCache.record('post-multi')

        expect(await pvCache.getPending('post-multi')).toBe(5)
    })

    it('should handle getPending for non-existent post', async () => {
        const pending = await pvCache.getPending('never-recorded')
        expect(pending).toBe(0)
    })

    it('should clear all cached data', async () => {
        await pvCache.record('post1')
        await pvCache.record('post2')
        await pvCache.record('post3')

        expect(await pvCache.getPending('post1')).toBe(1)
        expect(await pvCache.getPending('post2')).toBe(1)
        expect(await pvCache.getPending('post3')).toBe(1)

        await pvCache.clear()

        expect(await pvCache.getPending('post1')).toBe(0)
        expect(await pvCache.getPending('post2')).toBe(0)
        expect(await pvCache.getPending('post3')).toBe(0)
    })

    it('should handle multiple flushes correctly', async () => {
        const mockRepo = {
            increment: vi.fn().mockResolvedValue({ affected: 1 }),
        }
        const mockManager = {
            getRepository: vi.fn().mockReturnValue(mockRepo),
        }

        vi.mocked(dataSource.transaction).mockImplementation(async (callback: any) => await callback(mockManager))

        // 第一批数据
        await pvCache.record('post-a')
        await pvCache.flush()

        expect(mockRepo.increment).toHaveBeenCalledTimes(1)

        // 第二批数据
        await pvCache.record('post-b')
        await pvCache.flush()

        expect(mockRepo.increment).toHaveBeenCalledTimes(2)
    })

    it('should merge counts from multiple records before flush', async () => {
        const mockRepo = {
            increment: vi.fn().mockResolvedValue({ affected: 1 }),
        }
        const mockManager = {
            getRepository: vi.fn().mockReturnValue(mockRepo),
        }

        vi.mocked(dataSource.transaction).mockImplementation(async (callback: any) => await callback(mockManager))

        // 记录多次
        await pvCache.record('post-merge')
        await pvCache.record('post-merge')
        await pvCache.record('post-merge')

        await pvCache.flush()

        // 应该只调用一次 increment，但增量为 3
        expect(mockRepo.increment).toHaveBeenCalledWith({ id: 'post-merge' }, 'views', 3)
        expect(mockRepo.increment).toHaveBeenCalledTimes(1)
    })
})
