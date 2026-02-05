import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'
import { requireAdmin } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const { page = 1, pageSize = 20, email } = getQuery(event)
    const skip = (Number(page) - 1) * Number(pageSize)
    const take = Number(pageSize)

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
            page: Number(page),
            pageSize: Number(pageSize),
        },
    }
})
