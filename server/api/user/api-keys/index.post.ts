import dayjs from 'dayjs'
import { dataSource } from '@/server/database'
import { ApiKey } from '@/server/entities/api-key'
import { generateApiKey, hashApiKey } from '@/server/utils/api-key'
import { requireAuth } from '@/server/utils/permission'
import { userApiKeySchema } from '@/utils/schemas/user-api-key'

export default defineEventHandler(async (event) => {
    const body = await readValidatedBody(event, (b) => userApiKeySchema.parse(b))
    const session = await requireAuth(event)

    const rawKey = generateApiKey()
    const hashedKey = hashApiKey(rawKey)
    const prefix = rawKey.slice(0, 16) // momei_sk_ + 7 chars

    const apiKey = new ApiKey()
    apiKey.userId = session.user.id
    apiKey.name = body.name
    apiKey.key = hashedKey
    apiKey.prefix = prefix

    if (body.expiresIn && body.expiresIn !== 'never') {
        const days = Number.parseInt(body.expiresIn.replace('d', ''))
        apiKey.expiresAt = dayjs().add(days, 'day').toDate()
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
