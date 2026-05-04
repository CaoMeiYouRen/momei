import { friendLinkService } from '@/server/services/friend-link'
import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { adminFriendLinkListQuerySchema } from '@/utils/schemas/friend-link'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const { page, limit, status, categoryId, featured, keyword } = await getValidatedQuery(event, (query) =>
        adminFriendLinkListQuerySchema.parse(query),
    )

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
