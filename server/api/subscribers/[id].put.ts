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
