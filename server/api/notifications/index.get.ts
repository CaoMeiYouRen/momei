import { z } from 'zod'
import { dataSource } from '@/server/database'
import { InAppNotification } from '@/server/entities/in-app-notification'
import { requireAuth } from '@/server/utils/permission'
import { paginate } from '@/server/utils/response'

const querySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    unreadOnly: z.preprocess((v) => v === 'true', z.boolean()).optional(),
})

export default eventHandler(async (event) => {
    const session = await requireAuth(event)
    const query = await getValidatedQuery(event, querySchema.parse)

    const repo = dataSource.getRepository(InAppNotification)
    const queryBuilder = repo.createQueryBuilder('notification')
        .where('(notification.userId = :userId OR notification.userId IS NULL)', { userId: session.user.id })
        .orderBy('notification.createdAt', 'DESC')

    if (query.unreadOnly) {
        queryBuilder.andWhere('notification.isRead = :isRead', { isRead: false })
    }

    const [items, total] = await queryBuilder
        .skip((query.page - 1) * query.limit)
        .take(query.limit)
        .getManyAndCount()

    return paginate(items, total, query.page, query.limit)
})
