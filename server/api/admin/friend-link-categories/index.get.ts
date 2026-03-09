import { friendLinkService } from '@/server/services/friend-link'
import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const items = await friendLinkService.getCategories()
    return success(items)
})
