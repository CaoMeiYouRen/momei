import { dataSource } from '@/server/database'
import { MarketingCampaign } from '@/server/entities/marketing-campaign'
import { requireAdmin } from '@/server/utils/permission'
import { parsePagination } from '@/server/utils/pagination'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const query = getQuery(event)
    const { page, limit } = parsePagination(query)
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
