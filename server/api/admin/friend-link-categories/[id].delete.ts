import { friendLinkService } from '@/server/services/friend-link'
import { requireAdmin } from '@/server/utils/permission'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const id = getRequiredRouterParam(event, 'id')
    await friendLinkService.deleteCategory(id)
    return success(null)
})
