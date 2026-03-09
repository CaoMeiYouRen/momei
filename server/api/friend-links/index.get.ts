import { friendLinkService } from '@/server/services/friend-link'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const featured = String(query.featured || 'false') === 'true'
    const limit = query.limit ? Number(query.limit) : undefined
    const categoryId = typeof query.categoryId === 'string' ? query.categoryId : undefined

    const data = await friendLinkService.getPublicFriendLinks({
        featured,
        limit,
        categoryId,
    })

    return success(data)
})
