import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'
import { requireAdmin } from '@/server/utils/permission'
import { assignDefined } from '@/server/utils/object'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const subscriberRepo = dataSource.getRepository(Subscriber)

    const subscriber = await subscriberRepo.findOneBy({ id })
    if (!subscriber) {
        throw createError({ statusCode: 404, statusMessage: 'Subscriber not found' })
    }

    assignDefined(subscriber, body, ['isActive', 'language', 'userId'])

    await subscriberRepo.save(subscriber)

    return {
        code: 200,
        data: subscriber,
    }
})
