import { dataSource } from '@/server/database'
import { MarketingCampaign } from '@/server/entities/marketing-campaign'
import { requireAdmin } from '@/server/utils/permission'

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
        relations: ['sender'],
    })

    if (!campaign) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Campaign not found',
        })
    }

    return {
        code: 200,
        data: campaign,
    }
})
