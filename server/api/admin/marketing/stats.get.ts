import { dataSource } from '@/server/database'
import { MarketingCampaign } from '@/server/entities/marketing-campaign'
import { Subscriber } from '@/server/entities/subscriber'
import { requireAdmin } from '@/server/utils/permission'
import { MarketingCampaignStatus } from '@/utils/shared/notification'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const campaignRepo = dataSource.getRepository(MarketingCampaign)
    const subscriberRepo = dataSource.getRepository(Subscriber)

    const totalCampaigns = await campaignRepo.count()
    const completedCampaigns = await campaignRepo.count({
        where: { status: MarketingCampaignStatus.COMPLETED },
    })
    const totalSubscribers = await subscriberRepo.count({
        where: { isActive: true },
    })
    const marketingSubscribers = await subscriberRepo.count({
        where: { isActive: true, isMarketingEnabled: true },
    })

    return {
        code: 200,
        data: {
            totalCampaigns,
            completedCampaigns,
            totalSubscribers,
            marketingSubscribers,
        },
    }
})
