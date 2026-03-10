import { friendLinkService } from '@/server/services/friend-link'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const featured = typeof query.featured === 'string' ? query.featured === 'true' : false
    const limit = query.limit ? Number(query.limit) : undefined
    const categoryId = typeof query.categoryId === 'string' ? query.categoryId : undefined

    const data = await friendLinkService.getPublicFriendLinks({
        featured,
        limit,
        categoryId,
    })

    return success(data)
})
