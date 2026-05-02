import { dataSource } from '@/server/database'
import { BenefitWaitlist } from '@/server/entities/benefit-waitlist'
import { requireAdmin } from '@/server/utils/permission'
import { waitlistListQuerySchema } from '@/utils/schemas/benefit-waitlist'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const { page, pageSize, search, purpose } = await getValidatedQuery(event, (query) =>
        waitlistListQuerySchema.parse(query),
    )
    const skip = (page - 1) * pageSize
    const take = pageSize

    const repo = dataSource.getRepository(BenefitWaitlist)
    const queryBuilder = repo.createQueryBuilder('waitlist')
        .orderBy('waitlist.createdAt', 'DESC')
        .skip(skip)
        .take(take)

    if (search && typeof search === 'string') {
        queryBuilder.andWhere(
            '(waitlist.name LIKE :search OR waitlist.email LIKE :search)',
            { search: `%${search}%` },
        )
    }

    if (purpose && typeof purpose === 'string') {
        queryBuilder.andWhere('waitlist.purpose = :purpose', { purpose })
    }

    const [items, total] = await queryBuilder.getManyAndCount()

    return {
        code: 200,
        data: {
            items,
            total,
            page,
            pageSize,
        },
    }
})
