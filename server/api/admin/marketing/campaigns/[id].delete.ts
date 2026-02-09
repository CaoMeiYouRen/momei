import { dataSource } from '@/server/database'
import { MarketingCampaign } from '@/server/entities/marketing-campaign'
import { requireAdmin } from '@/server/utils/permission'
import { MarketingCampaignStatus } from '@/utils/shared/notification'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing campaign id',
        })
    }

    const campaignRepo = dataSource.getRepository(MarketingCampaign)
    const campaign = await campaignRepo.findOne({
        where: { id },
    })

    if (!campaign) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Campaign not found',
        })
    }

    if (campaign.status === MarketingCampaignStatus.SENDING) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Cannot delete a campaign that is currently sending',
        })
    }

    await campaignRepo.remove(campaign)

    return {
        code: 200,
        message: 'Campaign deleted successfully',
    }
})
