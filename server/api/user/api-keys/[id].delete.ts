import { auth } from '@/lib/auth'
import { dataSource } from '@/server/database'
import { ApiKey } from '@/server/entities/api-key'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const session = await auth.api.getSession({ headers: event.headers })
    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const repo = dataSource.getRepository(ApiKey)
    const key = await repo.findOne({ where: { id, userId: session.user.id } })
    if (!key) {
        throw createError({ statusCode: 404, statusMessage: 'Key not found' })
    }

    await repo.remove(key)

    return {
        code: 200,
        message: 'Deleted',
    }
})
