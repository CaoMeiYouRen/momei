import { friendLinkService } from '@/server/services/friend-link'
import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { friendLinkApplicationListQuerySchema } from '@/utils/schemas/friend-link'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const { page, limit, status } = await getValidatedQuery(event, (query) =>
        friendLinkApplicationListQuerySchema.parse(query),
    )

    const data = await friendLinkService.getApplications({ page, limit, status })
    return success(data)
})
