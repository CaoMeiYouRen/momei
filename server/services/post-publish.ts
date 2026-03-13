import { createCampaignFromPost, sendMarketingCampaign } from './notification'
import logger from '@/server/utils/logger'
import type { Post, PublishIntent } from '@/types/post'
import { MarketingCampaignStatus } from '@/utils/shared/notification'

/**
 * 执行文章发布的副作用（发送推送等）
 */
export async function executePublishEffects(post: Post, intent: PublishIntent) {
    if (!post.id) {
        return
    }
    const senderId = post.authorId || '0' // 使用作者 ID 或系统 ID

    // 处理推送通知
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
