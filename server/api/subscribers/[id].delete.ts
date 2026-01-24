import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'
import { requireAdmin } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const id = getRouterParam(event, 'id')
    const subscriberRepo = dataSource.getRepository(Subscriber)

    const subscriber = await subscriberRepo.findOneBy({ id })
    if (!subscriber) {
        throw createError({ statusCode: 404, statusMessage: 'Subscriber not found' })
    }

    await subscriberRepo.remove(subscriber)

    return {
        code: 200,
        message: 'Successfully deleted',
    }
})
