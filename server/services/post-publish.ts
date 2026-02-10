import { createCampaignFromPost, sendMarketingCampaign } from './notification'
import logger from '@/server/utils/logger'
import type { Post, PublishIntent } from '@/types/post'
import { MarketingCampaignStatus } from '@/utils/shared/notification'

/**
 * 执行文章发布的副作用（同步到 Memos、发送推送等）
 */
export async function executePublishEffects(post: Post, intent: PublishIntent) {
    if (!post.id) {
        return
    }
    const senderId = post.authorId || '0' // 使用作者 ID 或系统 ID

    // 1. 同步到 Memos (如果开启)
    if (intent.syncToMemos) {
        try {
            await syncPostToMemos(post)
        } catch (error) {
            logger.error('[PostPublishService] Failed to sync to Memos:', error)
        }
    }

    // 2. 处理推送通知
    if (intent.pushOption && intent.pushOption !== 'none') {
        try {
            const status = intent.pushOption === 'now'
                ? MarketingCampaignStatus.SENDING
                : MarketingCampaignStatus.DRAFT

            const campaign = await createCampaignFromPost(
                post.id,
                senderId,
                status,
                intent.pushCriteria,
            )

            if (intent.pushOption === 'now' && campaign) {
                await sendMarketingCampaign(campaign.id)
            }
        } catch (error) {
            logger.error('[PostPublishService] Failed to handle push notification campaign:', error)
        }
    }
}

/**
 * 将文章摘要 and 链接同步到 Memos
 */
async function syncPostToMemos(post: Post) {
    // 逻辑实现，例如调用 Memos API
    // 实际项目中可能有单独的服务处理此逻辑
    logger.info(`[PostPublishService] Syncing post ${post.id} to Memos...`)
    await Promise.resolve()
}
