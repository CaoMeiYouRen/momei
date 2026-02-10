import { dataSource } from '@/server/database'
import { MarketingCampaign } from '@/server/entities/marketing-campaign'
import { requireAdmin } from '@/server/utils/permission'
import { marketingCampaignSchema } from '@/utils/schemas/notification'
import { MarketingCampaignStatus, MarketingCampaignType } from '@/utils/shared/notification'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing campaign id',
        })
    }

    const result = await readValidatedBody(event, (body) => marketingCampaignSchema.safeParse(body))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
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

    if (campaign.status === MarketingCampaignStatus.COMPLETED || campaign.status === MarketingCampaignStatus.SENDING) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Cannot edit a campaign that is already sent or sending',
        })
    }

    campaign.title = result.data.title
    campaign.content = result.data.content
    campaign.type = result.data.type ?? MarketingCampaignType.FEATURE
    campaign.targetCriteria = result.data.targetCriteria

    if (result.data.scheduledAt) {
        campaign.scheduledAt = new Date(result.data.scheduledAt)
        campaign.status = MarketingCampaignStatus.SCHEDULED
    } else if (campaign.status === MarketingCampaignStatus.SCHEDULED) {
        // If it was scheduled before and now scheduledAt is removed, revert to DRAFT
        campaign.status = MarketingCampaignStatus.DRAFT
        campaign.scheduledAt = null
    }

    await campaignRepo.save(campaign)

    return {
        code: 200,
        message: 'Campaign updated successfully',
        data: campaign,
    }
})
