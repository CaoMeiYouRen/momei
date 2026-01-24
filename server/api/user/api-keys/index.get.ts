import { dataSource } from '@/server/database'
import { ApiKey } from '@/server/entities/api-key'
import { requireAuth } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)
    const { user } = session

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
