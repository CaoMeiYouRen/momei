import { LessThanOrEqual } from 'typeorm'
import { executePublishEffects } from './post-publish'
import { sendMarketingCampaign } from './notification'
import logger from '@/server/utils/logger'
import { Post } from '@/server/entities/post'
import { MarketingCampaign } from '@/server/entities/marketing-campaign'
import { dataSource } from '@/server/database'
import { PostStatus, type PublishIntent } from '@/types/post'
import { MarketingCampaignStatus } from '@/utils/shared/notification'
import { acquireLock, releaseLock } from '@/server/utils/redis'

const LOCK_KEY = 'momei:lock:scheduled-tasks'
const LOCK_TTL = 60000 // 1 minute

/**
 * 扫描并执行所有定时任务
 */
export const processScheduledTasks = async () => {
    // 1. 尝试获取分布式锁
    const hasLock = await acquireLock(LOCK_KEY, LOCK_TTL)
    if (!hasLock) {
        logger.info('[TaskEngine] Failed to acquire lock, skip this round.')
        return
    }

    try {
        const now = new Date()
        await processScheduledPosts(now)
        await processScheduledCampaigns(now)
    } finally {
        // 释放锁
        await releaseLock(LOCK_KEY)
    }
}

/**
 * 扫描并处理所有到达发布时间的定时文章
 */
export const processScheduledPosts = async (now = new Date()) => {
    try {
        const postRepo = dataSource.getRepository(Post)

        // 查找已到期的定时文章
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
                // 执行发布状态更新
                await postRepo.update(post.id, {
                    status: PostStatus.PUBLISHED,
                })

                // 执行发布副作用 (从 metadata 中恢复意图)
                const intent = (post.publishIntent as PublishIntent) || {}
                await executePublishEffects(post as any, intent)

                logger.info(`[TaskEngine] Successfully published post: ${post.title} (ID: ${post.id})`)
            } catch (err) {
                logger.error(`[TaskEngine] Failed to publish post ${post.id}:`, err)
            }
        }
    } catch (err) {
        logger.error('[TaskEngine] Error in processScheduledPosts:', err)
    }
}

/**
 * 扫描并处理所有到达时间的定时营销推送
 */
export const processScheduledCampaigns = async (now = new Date()) => {
    try {
        const campaignRepo = dataSource.getRepository(MarketingCampaign)

        // 查找已到期的定时推送
        const scheduledCampaigns = await campaignRepo.find({
            where: {
                status: MarketingCampaignStatus.SCHEDULED,
                scheduledAt: LessThanOrEqual(now),
            },
        })

        if (scheduledCampaigns.length === 0) {
            return
        }

        logger.info(`[TaskEngine] Found ${scheduledCampaigns.length} campaigns to send.`)

        for (const campaign of scheduledCampaigns) {
            try {
                // 执行发送 (sendMarketingCampaign 内部会处理状态变更)
                await sendMarketingCampaign(campaign.id)
                logger.info(`[TaskEngine] Successfully triggered campaign: ${campaign.title} (ID: ${campaign.id})`)
            } catch (err) {
                logger.error(`[TaskEngine] Failed to send campaign ${campaign.id}:`, err)
            }
        }
    } catch (err) {
        logger.error('[TaskEngine] Error in processScheduledCampaigns:', err)
    }
}
