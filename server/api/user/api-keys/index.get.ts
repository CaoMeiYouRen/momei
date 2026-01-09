import { auth } from '@/lib/auth'
import { dataSource } from '@/server/database'
import { ApiKey } from '@/server/entities/api-key'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({ headers: event.headers })
    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const repo = dataSource.getRepository(ApiKey)
    const keys = await repo.find({
        where: { userId: session.user.id },
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
