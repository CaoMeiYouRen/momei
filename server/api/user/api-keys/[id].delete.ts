import { dataSource } from '@/server/database'
import { ApiKey } from '@/server/entities/api-key'
import { requireAuth } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const session = await requireAuth(event)

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
