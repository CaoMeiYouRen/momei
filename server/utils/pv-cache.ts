import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import logger from '@/server/utils/logger'

class PVCache {
    private cache: Map<string, number> = new Map()
    private isFlushPending = false

    /**
     * 记录一次阅读量
     * @param postId 文章 ID
     */
    record(postId: string) {
        const current = this.cache.get(postId) || 0
        this.cache.set(postId, current + 1)
    }

    /**
     * 获取指定文章待入库的阅读量
     * @param postId 文章 ID
     */
    getPending(postId: string): number {
        return this.cache.get(postId) || 0
    }

    /**
     * 清理缓存（主要用于测试）
     */
    clear() {
        this.cache.clear()
        this.isFlushPending = false
    }

    /**
     * 将缓存中的阅读量刷入数据库
     */
    async flush() {
        if (this.cache.size === 0 || this.isFlushPending) {
            return
        }

        this.isFlushPending = true
        const currentCache = new Map(this.cache)
        this.cache.clear()

        try {
            logger.info(`[PVCache] Starting to flush PV updates for ${currentCache.size} posts.`, { module: 'PVCache' })

            // 使用事务确保一致性，或者分批处理以防长时间锁表
            // 对于 PV 统计，分批或逐个增加即可，因为丢失非核心数据比锁表影响小
            // 这里采用单事务批量处理
            await dataSource.transaction(async (manager) => {
                const repo = manager.getRepository(Post)
                for (const [id, count] of currentCache) {
                    try {
                        const result = await repo.increment({ id }, 'views', count)
                        if (result.affected === 0) {
                            logger.warn(`[PVCache] Post ${id} not found during flush, views lost: ${count}`, { module: 'PVCache' })
                        }
                    } catch (err) {
                        logger.error(`[PVCache] Error flushing post ${id}:`, { error: err, module: 'PVCache' })
                        // 失败了就不放回去了，避免死循环或者重复错误；PV 统计允许少量丢失
                    }
                }
            })

            logger.info(`[PVCache] Flushed PV updates successfully.`, { module: 'PVCache' })
        } catch (error) {
            logger.error(`[PVCache] Critical error during flush:`, { error, module: 'PVCache' })
            // 如果整个事务失败，理论上 currentCache 中的数据丢了。
            // 考虑鲁棒性，可以在失败时尝试恢复到 cache 中，但需小心处理并发。
        } finally {
            this.isFlushPending = false
        }
    }
}

export const pvCache = new PVCache()
