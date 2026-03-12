import { success } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { isAdmin } from '@/utils/shared/roles'
import { restorePostVersionService } from '@/server/services/post-version'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const versionId = getRouterParam(event, 'versionId')

    if (!id || !versionId) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID and Version ID are required' })
    }

    const session = await requireAdminOrAuthor(event)
    const result = await restorePostVersionService(id, versionId, {
        currentUserId: session.user.id,
        isAdmin: isAdmin(session.user.role),
    }, {
        ipAddress: getRequestIP(event, { xForwardedFor: true }) || null,
        userAgent: getRequestHeader(event, 'user-agent') || null,
    })

    return success(result)
})
