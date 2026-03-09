import { friendLinkService } from '@/server/services/friend-link'
import { requireAdmin } from '@/server/utils/permission'
import { FriendLinkStatus } from '@/types/friend-link'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const query = getQuery(event)
    const page = Number(query.page || 1)
    const limit = Number(query.limit || 20)
    const status = typeof query.status === 'string' ? query.status as FriendLinkStatus : undefined
    const categoryId = typeof query.categoryId === 'string' ? query.categoryId : undefined
    const featured = query.featured === undefined ? undefined : String(query.featured) === 'true'
    const keyword = typeof query.keyword === 'string' ? query.keyword : undefined

    const data = await friendLinkService.getFriendLinks({
        page,
        limit,
        status,
        categoryId,
        featured,
        keyword,
    })

    return success(data)
})
