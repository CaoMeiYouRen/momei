import { z } from 'zod'
import { auth } from '@/lib/auth'
import { dataSource } from '@/server/database'
import { ApiKey } from '@/server/entities/api-key'
import { generateApiKey, hashApiKey } from '@/server/utils/api-key'

const schema = z.object({
    name: z.string().min(1).max(50),
    expiresAt: z.string().optional(), // ISO date string
})

export default defineEventHandler(async (event) => {
    const body = await readValidatedBody(event, (b) => schema.parse(b))
    const session = await auth.api.getSession({ headers: event.headers })
    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const rawKey = generateApiKey()
    const hashedKey = hashApiKey(rawKey)
    const prefix = rawKey.slice(0, 16) // momei_sk_ + 7 chars

    const apiKey = new ApiKey()
    apiKey.userId = session.user.id
    apiKey.name = body.name
    apiKey.key = hashedKey
    apiKey.prefix = prefix
    if (body.expiresAt) {
        apiKey.expiresAt = new Date(body.expiresAt)
    }

    const repo = dataSource.getRepository(ApiKey)
    await repo.save(apiKey)

    return {
        code: 200,
        data: {
            id: apiKey.id,
            name: apiKey.name,
            key: rawKey, // Show only once
            prefix: apiKey.prefix,
            createdAt: apiKey.createdAt,
            expiresAt: apiKey.expiresAt,
        },
    }
})
