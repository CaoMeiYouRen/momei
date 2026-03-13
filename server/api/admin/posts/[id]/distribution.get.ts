import { success } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { getPostDistributionService } from '@/server/services/post-distribution'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID is required' })
    }

    const session = await requireAdminOrAuthor(event)
    const summary = await getPostDistributionService(id, {
        currentUserId: session.user.id,
        isAdmin: isAdmin(session.user.role),
    })

    return success(summary)
})
