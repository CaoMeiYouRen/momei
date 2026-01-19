import { Redis } from 'ioredis'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { REDIS_URL } from '@/utils/shared/env'
import logger from '@/server/utils/logger'
import { isServerlessEnvironment } from './env'

class PVCache {
    private cache: Map<string, number> = new Map()
    private isFlushPending = false
    private redis: Redis | null = null
    private readonly REDIS_PREFIX = 'momei:pv:'
    private readonly REDIS_SET_KEY = 'momei:pv:pending_ids'

    constructor() {
        if (REDIS_URL) {
            try {
                this.redis = new Redis(REDIS_URL, {
                    maxRetriesPerRequest: 3,
                    retryStrategy: (times) => Math.min(times * 50, 2000),
                })
                logger.info('[PVCache] Redis initialized for PV caching.', { module: 'PVCache' })
            } catch (err) {
                logger.error('[PVCache] Failed to initialize Redis:', { error: err, module: 'PVCache' })
            }
        }
    }

    /**
     * 记录一次阅读量
     * @param postId 文章 ID
     */
    async record(postId: string) {
        // 1. 如果有 Redis，优先使用 Redis
        if (this.redis) {
            try {
                const multi = this.redis.multi()
                multi.incr(`${this.REDIS_PREFIX}buf:${postId}`)
                multi.sadd(this.REDIS_SET_KEY, postId)
                await multi.exec()
                return
            } catch (err) {
                logger.error(`[PVCache] Redis record error for ${postId}, falling back:`, { error: err, module: 'PVCache' })
                // Redis 失败后回退到后续逻辑
            }
        }

        // 2. 如果是无服务器环境且没有 Redis，则直接更新数据库（防止数据丢失）
        if (isServerlessEnvironment()) {
            try {
                const postRepo = dataSource.getRepository(Post)
                await postRepo.increment({ id: postId }, 'views', 1)
                return
            } catch (err) {
                logger.error(`[PVCache] Direct DB update failed in serverless for ${postId}:`, { error: err, module: 'PVCache' })
            }
        }

        // 3. 回退到内存缓存（常驻进程环境）
        const current = this.cache.get(postId) || 0
        this.cache.set(postId, current + 1)
    }

    /**
     * 获取指定文章待入库的阅读量
     * @param postId 文章 ID
     */
    async getPending(postId: string): Promise<number> {
        let pending = 0

        // 合并 Redis 中的增量
        if (this.redis) {
            try {
                const redisVal = await this.redis.get(`${this.REDIS_PREFIX}buf:${postId}`)
                if (redisVal) {
                    pending += parseInt(redisVal, 10)
                }
            } catch {
                // Ignore error for read
            }
        }

        // 合并内存中的增量
        pending += this.cache.get(postId) || 0

        return pending
    }

    /**
     * 清理缓存（主要用于测试）
     */
    async clear() {
        this.cache.clear()
        this.isFlushPending = false
        if (this.redis) {
            const keys = await this.redis.keys(`${this.REDIS_PREFIX}*`)
            if (keys.length > 0) {
                await this.redis.del(...keys)
            }
        }
    }

    /**
     * 将缓存中的阅读量刷入数据库
     */
    async flush() {
        if (this.isFlushPending) {
            return
        }

        // 准备待处理的数据集
        const updates = new Map<string, number>()

        // A. 提取内存数据
        if (this.cache.size > 0) {
            for (const [id, count] of this.cache) {
                updates.set(id, (updates.get(id) || 0) + count)
            }
            this.cache.clear()
        }

        // B. 提取 Redis 数据
        if (this.redis) {
            try {
                const ids = await this.redis.smembers(this.REDIS_SET_KEY)
                if (ids.length > 0) {
                    for (const id of ids) {
                        const key = `${this.REDIS_PREFIX}buf:${id}`
                        // 使用 getset 原子性获取并重置
                        const val = await this.redis.getset(key, '0')
                        const count = parseInt(val || '0', 10)
                        if (count > 0) {
                            updates.set(id, (updates.get(id) || 0) + count)
                        }
                        await this.redis.srem(this.REDIS_SET_KEY, id)
                    }
                }
            } catch (err) {
                logger.error('[PVCache] Redis flush error:', { error: err, module: 'PVCache' })
            }
        }

        if (updates.size === 0) {
            return
        }

        this.isFlushPending = true

        try {
            logger.info(`[PVCache] Starting to flush PV updates for ${updates.size} posts.`, { module: 'PVCache' })

            await dataSource.transaction(async (manager) => {
                const repo = manager.getRepository(Post)
                for (const [id, count] of updates) {
                    try {
                        const result = await repo.increment({ id }, 'views', count)
                        if (result.affected === 0) {
                            logger.warn(`[PVCache] Post ${id} not found during flush, views lost: ${count}`, { module: 'PVCache' })
                        }
                    } catch (err) {
                        logger.error(`[PVCache] Error flushing post ${id}:`, { error: err, module: 'PVCache' })
                    }
                }
            })

            logger.info(`[PVCache] Flushed PV updates successfully.`, { module: 'PVCache' })
        } catch (error) {
            logger.error(`[PVCache] Critical error during flush:`, { error, module: 'PVCache' })
        } finally {
            this.isFlushPending = false
        }
    }
}

export const pvCache = new PVCache()
