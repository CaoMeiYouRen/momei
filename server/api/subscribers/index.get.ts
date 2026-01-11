import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'
import { auth } from '@/lib/auth'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || session.user.role !== 'admin') {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const { page = 1, pageSize = 20, email } = getQuery(event)
    const skip = (Number(page) - 1) * Number(pageSize)
    const take = Number(pageSize)

    const subscriberRepo = dataSource.getRepository(Subscriber)
    const queryBuilder = subscriberRepo.createQueryBuilder('subscriber')
        .leftJoinAndSelect('subscriber.user', 'user')
        .orderBy('subscriber.createdAt', 'DESC')
        .skip(skip)
        .take(take)

    if (email) {
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
