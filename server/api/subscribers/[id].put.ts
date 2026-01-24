import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const subscriberRepo = dataSource.getRepository(Subscriber)

    const subscriber = await subscriberRepo.findOneBy({ id })
    if (!subscriber) {
        throw createError({ statusCode: 404, statusMessage: 'Subscriber not found' })
    }

    if (typeof body.isActive === 'boolean') {
        subscriber.isActive = body.isActive
    }
    if (body.language) {
        subscriber.language = body.language
    }

    await subscriberRepo.save(subscriber)

    return {
        code: 200,
        data: subscriber,
    }
})
