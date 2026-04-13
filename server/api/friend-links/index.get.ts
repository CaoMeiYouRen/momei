import { friendLinkService } from '@/server/services/friend-link'
import { success } from '@/server/utils/response'
import { buildRuntimeApiCacheKey, withRuntimeApiCache } from '@/server/utils/api-runtime-cache'

const PUBLIC_FRIEND_LINKS_CACHE_TTL_SECONDS = 60

function buildPublicFriendLinksCacheKey(featured: boolean, limit?: number, categoryId?: string) {
    return buildRuntimeApiCacheKey('friend-links:public', featured, limit ?? 'all', categoryId ?? 'all')
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const featured = typeof query.featured === 'string' ? query.featured === 'true' : false
    const limit = query.limit ? Number(query.limit) : undefined
    const categoryId = typeof query.categoryId === 'string' ? query.categoryId : undefined
    const cacheKey = buildPublicFriendLinksCacheKey(featured, limit, categoryId)

    return await withRuntimeApiCache({
        event,
        key: cacheKey,
        ttlSeconds: PUBLIC_FRIEND_LINKS_CACHE_TTL_SECONDS,
        isSharedPublicResponse: true,
        loader: async () => {
            const data = await friendLinkService.getPublicFriendLinks({
                featured,
                limit,
                categoryId,
            })

            return success(data)
        },
    })
})
