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
})
