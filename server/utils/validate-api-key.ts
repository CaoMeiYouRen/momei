import { getRequestHeader, createError, type H3Event } from 'h3'
import { dataSource } from '@/server/database'
import { ApiKey } from '@/server/entities/api-key'
import { verifyApiKey } from '@/server/utils/api-key'

export const validateApiKeyRequest = async (event: H3Event) => {
    const keyHeader = getRequestHeader(event, 'X-API-KEY') || getRequestHeader(event, 'Authorization')
    let token = ''
    if (keyHeader?.startsWith('Bearer ')) {
        token = keyHeader.substring(7)
    } else if (keyHeader) {
        token = keyHeader
    }

    if (!token) {
        throw createError({ statusCode: 401, statusMessage: 'Missing API Key' })
    }

    // Optimization: Use prefix to narrow down search
    const prefix = token.slice(0, 16)
    const repo = dataSource.getRepository(ApiKey)
    const potentialKeys = await repo.find({
        where: { prefix },
        select: ['id', 'key', 'expiresAt', 'userId'],
        relations: ['user'],
    })

    const matchedKey = potentialKeys.find((k: any) => verifyApiKey(token, k.key))

    if (!matchedKey) {
        throw createError({ statusCode: 401, statusMessage: 'Invalid API Key' })
    }

    if (matchedKey.expiresAt && new Date(matchedKey.expiresAt) < new Date()) {
        throw createError({ statusCode: 401, statusMessage: 'API Key Expired' })
    }

    // Update last used time
    matchedKey.lastUsedAt = new Date()
    await repo.save(matchedKey)

    const user = matchedKey.user
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'User not found' })
    }

    return { user, apiKey: matchedKey }
}
