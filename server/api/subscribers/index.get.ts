import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'
import { requireAdmin } from '@/server/utils/permission'
import { subscriberListQuerySchema } from '@/utils/schemas/subscriber'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const { page, pageSize, email } = await getValidatedQuery(event, (query) => subscriberListQuerySchema.parse(query))
    const skip = (page - 1) * pageSize
    const take = pageSize

    const subscriberRepo = dataSource.getRepository(Subscriber)
    const queryBuilder = subscriberRepo.createQueryBuilder('subscriber')
        .leftJoinAndSelect('subscriber.user', 'user')
        .orderBy('subscriber.createdAt', 'DESC')
        .skip(skip)
        .take(take)

    if (email && typeof email === 'string') {
        queryBuilder.andWhere('subscriber.email LIKE :email', { email: `%${email}%` })
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
