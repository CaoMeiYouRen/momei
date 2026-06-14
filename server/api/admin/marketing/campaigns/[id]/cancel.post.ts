import { z } from 'zod'
import { dataSource } from '@/server/database'
import { MarketingCampaign } from '@/server/entities/marketing-campaign'
import { requireAdmin } from '@/server/utils/permission'
import { MarketingCampaignStatus } from '@/utils/shared/notification'

const paramsSchema = z.object({ id: z.string().min(1) })

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const id = getRouterParam(event, 'id')
    const parsed = paramsSchema.safeParse({ id })

    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Campaign ID is required',
        })
    }

    const campaignRepo = dataSource.getRepository(MarketingCampaign)
    const campaign = await campaignRepo.findOne({
        where: { id: parsed.data.id },
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
            statusMessage: 'Cannot cancel a campaign that is currently sending',
        })
    }

    if (campaign.status === MarketingCampaignStatus.COMPLETED) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Cannot cancel a campaign that has already completed',
        })
    }

    if (campaign.status !== MarketingCampaignStatus.SCHEDULED) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Campaign is not scheduled',
        })
    }

    campaign.status = MarketingCampaignStatus.DRAFT
    campaign.scheduledAt = null
    await campaignRepo.save(campaign)

    return {
        code: 200,
        message: 'Campaign schedule cancelled successfully',
        data: campaign,
    }
})
