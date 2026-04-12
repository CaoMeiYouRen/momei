import { friendLinkService } from '@/server/services/friend-link'
import { success } from '@/server/utils/response'
import { getRuntimeCache, setRuntimeCache } from '@/server/utils/runtime-cache'

const PUBLIC_FRIEND_LINKS_CACHE_TTL_SECONDS = 60

function buildPublicFriendLinksCacheKey(featured: boolean, limit?: number, categoryId?: string) {
    return `friend-links:public:${featured ? '1' : '0'}:${limit ?? 'all'}:${categoryId ?? 'all'}`
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const featured = typeof query.featured === 'string' ? query.featured === 'true' : false
    const limit = query.limit ? Number(query.limit) : undefined
    const categoryId = typeof query.categoryId === 'string' ? query.categoryId : undefined
    const cacheKey = buildPublicFriendLinksCacheKey(featured, limit, categoryId)
    const cachedResponse = getRuntimeCache(cacheKey) as ReturnType<typeof success> | undefined

    if (cachedResponse) {
        // 命中进程内短缓存时仍下发同口径 Cache-Control，
        // 保持客户端/CDN 与服务端缓存语义一致。
        event.node?.res?.setHeader('Cache-Control', `public, max-age=${PUBLIC_FRIEND_LINKS_CACHE_TTL_SECONDS}`)
        return cachedResponse
    }

    const data = await friendLinkService.getPublicFriendLinks({
        featured,
        limit,
        categoryId,
    })

    const response = success(data)
    setRuntimeCache(cacheKey, response, PUBLIC_FRIEND_LINKS_CACHE_TTL_SECONDS)
    event.node?.res?.setHeader('Cache-Control', `public, max-age=${PUBLIC_FRIEND_LINKS_CACHE_TTL_SECONDS}`)

    return response
})
