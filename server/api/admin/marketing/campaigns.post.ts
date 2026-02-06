import { dataSource } from '@/server/database'
import { MarketingCampaign } from '@/server/entities/marketing-campaign'
import { requireAdmin } from '@/server/utils/permission'
import { marketingCampaignSchema } from '@/utils/schemas/notification'
import { MarketingCampaignStatus, MarketingCampaignType } from '@/utils/shared/notification'

export default defineEventHandler(async (event) => {
    const session = await requireAdmin(event)
    const userId = session.user.id

    const result = await readValidatedBody(event, (body) => marketingCampaignSchema.safeParse(body))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }

    const campaignRepo = dataSource.getRepository(MarketingCampaign)
    const campaign = new MarketingCampaign()
    campaign.title = result.data.title
    campaign.content = result.data.content
    campaign.type = result.data.type ?? MarketingCampaignType.FEATURE
    campaign.targetCriteria = result.data.targetCriteria
    campaign.senderId = userId
    campaign.status = MarketingCampaignStatus.DRAFT

    await campaignRepo.save(campaign)

    return {
        code: 201,
        message: 'Campaign created successfully',
        data: campaign,
    }
})
