import { dataSource } from '@/server/database'
import { MarketingCampaign } from '@/server/entities/marketing-campaign'
import { requireAdmin } from '@/server/utils/permission'
import { marketingCampaignListQuerySchema } from '@/utils/schemas/notification'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const result = await getValidatedQuery(event, (query) => marketingCampaignListQuerySchema.safeParse(query))
    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }

    const { page, limit } = result.data
    const campaignRepo = dataSource.getRepository(MarketingCampaign)

    const [items, total] = await campaignRepo.findAndCount({
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['sender'],
    })

    return {
        code: 200,
        data: {
            items,
            total,
            page,
            limit,
        },
    }
})
