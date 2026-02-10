import { Redis } from 'ioredis'
import { REDIS_URL } from '@/utils/shared/env'

let redis: Redis | null = null

if (REDIS_URL) {
    try {
        redis = new Redis(REDIS_URL, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        })
        redis.on('error', (err) => {
            console.error('[Redis] Connection error:', err)
        })
    } catch (err) {
        console.error('[Redis] Failed to initialize:', err)
    }
}

export const getRedis = () => redis

/**
 * 简单的分布式锁实现
 * @param key 锁的键名
 * @param ttl 锁的过期时间 (毫秒)
 */
export const acquireLock = async (key: string, ttl: number = 30000): Promise<boolean> => {
    if (!redis) {
        return true
    } // 无 Redis 时默认为单机环境，视为获取成功
    const result = await redis.set(key, 'locked', 'PX', ttl, 'NX')
    return result === 'OK'
}

/**
 * 释放分布式锁
 * @param key 锁的键名
 */
export const releaseLock = async (key: string): Promise<void> => {
    if (!redis) {
        return
    }
    await redis.del(key)
}
