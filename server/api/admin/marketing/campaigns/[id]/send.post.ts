import { Brackets } from 'typeorm'
import { dataSource } from '@/server/database'
import { MarketingCampaign } from '@/server/entities/marketing-campaign'
import { Subscriber } from '@/server/entities/subscriber'
import { requireAdmin } from '@/server/utils/permission'
import { MarketingCampaignStatus } from '@/utils/shared/notification'
import { sendEmail } from '@/server/utils/email'
import logger from '@/server/utils/logger'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const id = getRouterParam(event, 'id')
    const campaignRepo = dataSource.getRepository(MarketingCampaign)
    const subscriberRepo = dataSource.getRepository(Subscriber)

    const campaign = await campaignRepo.findOneBy({ id })
    if (!campaign) {
        throw createError({ statusCode: 404, statusMessage: 'Campaign not found' })
    }

    if (campaign.status === MarketingCampaignStatus.COMPLETED) {
        throw createError({ statusCode: 400, statusMessage: 'Campaign already sent' })
    }

    // 1. 更新状态为发送中
    campaign.status = MarketingCampaignStatus.SENDING
    await campaignRepo.save(campaign)

    // 2. 异步执行发送逻辑
    const sendCampaignTasks = async () => {
        try {
            const { categoryIds = [], tagIds = [] } = campaign.targetCriteria || {}

            const query = subscriberRepo.createQueryBuilder('subscriber')
                .where('subscriber.isActive = :isActive', { isActive: true })
                .andWhere('subscriber.isMarketingEnabled = :isMarketingEnabled', { isMarketingEnabled: true })

            if (categoryIds.length > 0 || tagIds.length > 0) {
                query.andWhere(new Brackets((qb) => {
                    if (categoryIds.length > 0) {
                        categoryIds.forEach((catId: string, index: number) => {
                            qb.orWhere(`subscriber.subscribedCategoryIds LIKE :cat${index}`, { [`cat${index}`]: `%${catId}%` })
                        })
                    }
                    if (tagIds.length > 0) {
                        tagIds.forEach((tagId: string, index: number) => {
                            qb.orWhere(`subscriber.subscribedTagIds LIKE :tag${index}`, { [`tag${index}`]: `%${tagId}%` })
                        })
                    }
                }))
            }

            const subscribers = await query.getMany()

            for (const subscriber of subscribers) {
                try {
                    await sendEmail({
                        to: subscriber.email,
                        subject: campaign.title,
                        html: campaign.content,
                    })
                } catch (err) {
                    logger.email.failed({
                        type: 'marketing-campaign',
                        email: subscriber.email,
                        error: err instanceof Error ? err.message : String(err),
                    })
                }
            }

            campaign.status = MarketingCampaignStatus.COMPLETED
            campaign.sentAt = new Date()
            await campaignRepo.save(campaign)
        } catch (error) {
            campaign.status = MarketingCampaignStatus.FAILED
            await campaignRepo.save(campaign)
            logger.error('Failed to send marketing campaign:', error)
        }
    }

    // 不等待发送完成
    sendCampaignTasks()

    return {
        code: 200,
        message: 'Campaign sending started',
    }
})
