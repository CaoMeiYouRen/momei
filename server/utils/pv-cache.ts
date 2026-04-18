import dayjs from 'dayjs'
import { Redis } from 'ioredis'
import type { Repository } from 'typeorm'
import { isServerlessEnvironment } from './env'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { PostViewHourly } from '@/server/entities/post-view-hourly'
import { REDIS_URL } from '@/utils/shared/env'
import logger from '@/server/utils/logger'

export interface PVHourlyBucketUpdate {
    postId: string
    bucketHourUtc: string
    count: number
}

const PV_BUCKET_KEY_SEPARATOR = '|'

export function resolvePVBucketHourUtc(viewedAt?: string | Date) {
    return dayjs(viewedAt || new Date()).utc().startOf('hour').toISOString()
}

export function buildPVHourlyBucketKey(postId: string, bucketHourUtc: string) {
    return `${bucketHourUtc}${PV_BUCKET_KEY_SEPARATOR}${postId}`
}

export function parsePVHourlyBucketKey(bucketKey: string) {
    const separatorIndex = bucketKey.lastIndexOf(PV_BUCKET_KEY_SEPARATOR)
    if (separatorIndex <= 0 || separatorIndex >= bucketKey.length - 1) {
        return null
    }

    return {
        bucketHourUtc: bucketKey.slice(0, separatorIndex),
        postId: bucketKey.slice(separatorIndex + 1),
    }
}

function isUniqueConstraintError(error: unknown) {
    if (!(error instanceof Error)) {
        return false
    }

    const candidate = error as Error & { code?: string }
    return [
        '23505',
        'ER_DUP_ENTRY',
        'SQLITE_CONSTRAINT',
        'SQLITE_CONSTRAINT_UNIQUE',
    ].includes(candidate.code || '')
    || error.message.includes('duplicate key value')
    || error.message.includes('Duplicate entry')
    || error.message.includes('UNIQUE constraint failed')
}

async function incrementHourlyBucket(
    repo: Repository<PostViewHourly>,
    postId: string,
    bucketHourUtc: string,
    count: number,
) {
    const bucketDate = new Date(bucketHourUtc)
    const incrementResult = await repo.increment({ postId, bucketHourUtc: bucketDate }, 'views', count)

    if (incrementResult.affected && incrementResult.affected > 0) {
        return
    }

    try {
        await repo.insert({
            postId,
            bucketHourUtc: bucketDate,
            views: count,
        })
    } catch (error) {
        if (!isUniqueConstraintError(error)) {
            throw error
        }

        await repo.increment({ postId, bucketHourUtc: bucketDate }, 'views', count)
    }
}

function addBucketUpdate(
    bucketUpdates: Map<string, PVHourlyBucketUpdate>,
    postUpdates: Map<string, number>,
    bucketKey: string,
    count: number,
) {
    const parsedKey = parsePVHourlyBucketKey(bucketKey)
    if (!parsedKey) {
        return
    }

    const existingBucketUpdate = bucketUpdates.get(bucketKey)
    if (existingBucketUpdate) {
        existingBucketUpdate.count += count
    } else {
        bucketUpdates.set(bucketKey, {
            postId: parsedKey.postId,
            bucketHourUtc: parsedKey.bucketHourUtc,
            count,
        })
    }

    postUpdates.set(parsedKey.postId, (postUpdates.get(parsedKey.postId) || 0) + count)
}

function mergeCountMaps(target: Map<string, number>, source: Map<string, number>) {
    for (const [key, count] of source) {
        target.set(key, (target.get(key) || 0) + count)
    }
}

class PVCache {
    private cache = new Map<string, number>()
    private pendingByPost = new Map<string, number>()
    private isFlushPending = false
    private redis: Redis | null = null
    private readonly REDIS_PREFIX = 'momei:pv:'
    private readonly REDIS_SET_KEY = 'momei:pv:pending_hourly_keys'
    private readonly REDIS_PROCESSING_SET_KEY = 'momei:pv:pending_hourly_keys:processing'

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
    async record(postId: string, viewedAt?: string | Date) {
        const bucketHourUtc = resolvePVBucketHourUtc(viewedAt)
        const bucketKey = buildPVHourlyBucketKey(postId, bucketHourUtc)

        // 1. 如果有 Redis，优先使用 Redis
        if (this.redis) {
            try {
                const multi = this.redis.multi()
                multi.incr(`${this.REDIS_PREFIX}buf:${bucketKey}`)
                multi.sadd(this.REDIS_SET_KEY, bucketKey)
                multi.incr(`${this.REDIS_PREFIX}post:${postId}`)
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
                await dataSource.transaction(async (manager) => {
                    const postRepo = manager.getRepository(Post)
                    const hourlyRepo = manager.getRepository(PostViewHourly)
                    await postRepo.increment({ id: postId }, 'views', 1)
                    await incrementHourlyBucket(hourlyRepo, postId, bucketHourUtc, 1)
                })
                return
            } catch (err) {
                logger.error(`[PVCache] Direct DB update failed in serverless for ${postId}:`, { error: err, module: 'PVCache' })
            }
        }

        // 3. 回退到内存缓存（常驻进程环境）
        this.cache.set(bucketKey, (this.cache.get(bucketKey) || 0) + 1)
        this.pendingByPost.set(postId, (this.pendingByPost.get(postId) || 0) + 1)
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
                const redisVal = await this.redis.get(`${this.REDIS_PREFIX}post:${postId}`)
                if (redisVal) {
                    pending += parseInt(redisVal, 10)
                }
            } catch {
                // Ignore error for read
            }
        }

        // 合并内存中的增量
        pending += this.pendingByPost.get(postId) || 0

        return pending
    }

    /**
     * 清理缓存（主要用于测试）
     */
    async clear() {
        this.cache.clear()
        this.pendingByPost.clear()
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

        this.isFlushPending = true

        // 准备待处理的数据集
        const bucketUpdates = new Map<string, PVHourlyBucketUpdate>()
        const postUpdates = new Map<string, number>()
        const memoryBucketSnapshot = this.cache
        const memoryPendingSnapshot = this.pendingByPost
        let redisBucketsCaptured = false
        let persistedToDatabase = false

        this.cache = new Map<string, number>()
        this.pendingByPost = new Map<string, number>()

        // A. 提取内存数据
        if (memoryBucketSnapshot.size > 0) {
            for (const [bucketKey, count] of memoryBucketSnapshot) {
                addBucketUpdate(bucketUpdates, postUpdates, bucketKey, count)
            }
        }

        try {
            // B. 提取 Redis 数据
            if (this.redis) {
                await this.redis.del(this.REDIS_PROCESSING_SET_KEY)
                const hasPendingRedisBuckets = await this.redis.exists(this.REDIS_SET_KEY)

                if (hasPendingRedisBuckets > 0) {
                    await this.redis.rename(this.REDIS_SET_KEY, this.REDIS_PROCESSING_SET_KEY)
                    redisBucketsCaptured = true

                    const bucketKeys = await this.redis.smembers(this.REDIS_PROCESSING_SET_KEY)
                    for (const bucketKey of bucketKeys) {
                        const key = `${this.REDIS_PREFIX}buf:${bucketKey}`
                        const val = await this.redis.getset(key, '0')
                        const count = parseInt(val || '0', 10)
                        if (count > 0) {
                            addBucketUpdate(bucketUpdates, postUpdates, bucketKey, count)
                        }
                    }
                }
            }

            if (postUpdates.size === 0 || bucketUpdates.size === 0) {
                if (this.redis && redisBucketsCaptured) {
                    await this.redis.del(this.REDIS_PROCESSING_SET_KEY)
                }
                return
            }

            logger.info(`[PVCache] Starting to flush PV updates for ${postUpdates.size} posts and ${bucketUpdates.size} hourly buckets.`, { module: 'PVCache' })

            await dataSource.transaction(async (manager) => {
                const postRepo = manager.getRepository(Post)
                const hourlyRepo = manager.getRepository(PostViewHourly)
                const persistedPostIds = new Set<string>()

                for (const [id, count] of postUpdates) {
                    try {
                        const result = await postRepo.increment({ id }, 'views', count)
                        if (result.affected === 0) {
                            logger.warn(`[PVCache] Post ${id} not found during flush, views lost: ${count}`, { module: 'PVCache' })
                            continue
                        }

                        persistedPostIds.add(id)
                    } catch (err) {
                        logger.error(`[PVCache] Error flushing post ${id}:`, { error: err, module: 'PVCache' })
                        throw err
                    }
                }

                for (const update of bucketUpdates.values()) {
                    if (!persistedPostIds.has(update.postId)) {
                        continue
                    }

                    try {
                        await incrementHourlyBucket(hourlyRepo, update.postId, update.bucketHourUtc, update.count)
                    } catch (err) {
                        logger.error(`[PVCache] Error flushing hourly bucket ${update.bucketHourUtc} for post ${update.postId}:`, {
                            error: err,
                            module: 'PVCache',
                        })
                        throw err
                    }
                }
            })

            persistedToDatabase = true

            if (this.redis && redisBucketsCaptured) {
                try {
                    for (const [postId, count] of postUpdates) {
                        const remaining = await this.redis.decrby(`${this.REDIS_PREFIX}post:${postId}`, count)
                        if (remaining < 0) {
                            await this.redis.set(`${this.REDIS_PREFIX}post:${postId}`, '0')
                        }
                    }

                    await this.redis.del(this.REDIS_PROCESSING_SET_KEY)
                } catch (cleanupError) {
                    logger.error('[PVCache] Redis cleanup after successful flush failed:', {
                        error: cleanupError,
                        module: 'PVCache',
                    })
                }
            }

            logger.info(`[PVCache] Flushed PV updates successfully.`, { module: 'PVCache' })
        } catch (error) {
            if (!persistedToDatabase) {
                mergeCountMaps(this.cache, memoryBucketSnapshot)
                mergeCountMaps(this.pendingByPost, memoryPendingSnapshot)
            }

            if (!persistedToDatabase && this.redis && bucketUpdates.size > 0) {
                try {
                    for (const [bucketKey, update] of bucketUpdates) {
                        await this.redis.incrby(`${this.REDIS_PREFIX}buf:${bucketKey}`, update.count)
                        await this.redis.sadd(this.REDIS_SET_KEY, bucketKey)
                    }

                    if (redisBucketsCaptured) {
                        await this.redis.del(this.REDIS_PROCESSING_SET_KEY)
                    }
                } catch (restoreError) {
                    logger.error('[PVCache] Failed to restore Redis buckets after flush error:', {
                        error: restoreError,
                        module: 'PVCache',
                    })
                }
            }

            logger.error(`[PVCache] Critical error during flush:`, { error, module: 'PVCache' })
        } finally {
            this.isFlushPending = false
        }
    }
}

export const pvCache = new PVCache()
