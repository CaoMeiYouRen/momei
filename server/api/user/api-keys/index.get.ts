import { dataSource } from '@/server/database'
import { ApiKey } from '@/server/entities/api-key'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const repo = dataSource.getRepository(ApiKey)
    const keys = await repo.find({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
    })

    return {
        code: 200,
        data: keys.map((k) => ({
            id: k.id,
            name: k.name,
            prefix: k.prefix,
            createdAt: k.createdAt,
            lastUsedAt: k.lastUsedAt,
            expiresAt: k.expiresAt,
        })),
    }
})
