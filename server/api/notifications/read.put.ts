import { z } from 'zod'
import { dataSource } from '@/server/database'
import { InAppNotification } from '@/server/entities/in-app-notification'
import { requireAuth } from '@/server/utils/permission'

const bodySchema = z.object({
    ids: z.array(z.string()).optional(), // 若不传则全部标记为已读
})

export default eventHandler(async (event) => {
    const session = await requireAuth(event)
    const body = await readValidatedBody(event, bodySchema.parse)

    const repo = dataSource.getRepository(InAppNotification)
    const queryBuilder = repo.createQueryBuilder()
        .update(InAppNotification)
        .set({ isRead: true })
        .where('userId = :userId', { userId: session.user.id })
        .andWhere('isRead = :isRead', { isRead: false })

    if (body.ids && body.ids.length > 0) {
        queryBuilder.andWhere('id IN (:...ids)', { ids: body.ids })
    }

    await queryBuilder.execute()

    return {
        message: 'Success',
    }
})
