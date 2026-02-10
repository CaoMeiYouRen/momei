import { LessThanOrEqual } from 'typeorm'
import { executePublishEffects } from './post-publish'
import logger from '@/server/utils/logger'
import { Post } from '@/server/entities/post'
import { dataSource } from '@/server/database'
import { PostStatus, type PublishIntent } from '@/types/post'
import { acquireLock, releaseLock } from '@/server/utils/redis'

const LOCK_KEY = 'momei:lock:publish-scheduled'
const LOCK_TTL = 60000 // 1 minute

/**
 * 扫描并处理所有到达发布时间的定时文章
 */
export const processScheduledPosts = async () => {
    // 1. 尝试获取分布式锁
    const hasLock = await acquireLock(LOCK_KEY, LOCK_TTL)
    if (!hasLock) {
        logger.info('[TaskEngine] Failed to acquire lock, skip this round.')
        return
    }

    try {
        const postRepo = dataSource.getRepository(Post)
        const now = new Date()

        // 2. 查找已到期的定时文章
        const scheduledPosts = await postRepo.find({
            where: {
                status: PostStatus.SCHEDULED,
                publishedAt: LessThanOrEqual(now),
            },
            relations: ['tags', 'category', 'author'],
        })

        if (scheduledPosts.length === 0) {
            return
        }

        logger.info(`[TaskEngine] Found ${scheduledPosts.length} posts to publish.`)

        for (const post of scheduledPosts) {
            try {
                // 3. 执行发布状态更新
                await postRepo.update(post.id, {
                    status: PostStatus.PUBLISHED,
                })

                // 4. 执行发布副作用 (从 metadata 中恢复意图)
                const intent = (post.publishIntent as PublishIntent) || {}
                await executePublishEffects(post as any, intent)

                logger.info(`[TaskEngine] Successfully published post: ${post.title} (ID: ${post.id})`)
            } catch (err) {
                logger.error(`[TaskEngine] Failed to publish post ${post.id}:`, err)
            }
        }
    } finally {
        // 5. 释放锁
        await releaseLock(LOCK_KEY)
    }
}
