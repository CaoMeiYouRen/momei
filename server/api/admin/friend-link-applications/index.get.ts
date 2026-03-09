import { friendLinkService } from '@/server/services/friend-link'
import { requireAdmin } from '@/server/utils/permission'
import { FriendLinkApplicationStatus } from '@/types/friend-link'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const query = getQuery(event)
    const page = Number(query.page || 1)
    const limit = Number(query.limit || 20)
    const status = typeof query.status === 'string' ? query.status as FriendLinkApplicationStatus : undefined

    const data = await friendLinkService.getApplications({ page, limit, status })
    return success(data)
})
