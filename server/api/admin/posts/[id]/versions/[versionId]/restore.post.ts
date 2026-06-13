import { z } from 'zod'
import { success } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { isAdmin } from '@/utils/shared/roles'
import { restorePostVersionService } from '@/server/services/post-version'

/** Route params: id — post ID, versionId — version ID (both required) */
const paramsSchema = z.object({ id: z.string().min(1), versionId: z.string().min(1) })

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const versionId = getRouterParam(event, 'versionId')
    const parsed = paramsSchema.safeParse({ id, versionId })

    if (!parsed.success) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID and Version ID are required' })
    }

    const session = await requireAdminOrAuthor(event)
    const result = await restorePostVersionService(parsed.data.id, parsed.data.versionId, {
        currentUserId: session.user.id,
        isAdmin: isAdmin(session.user.role),
    }, {
        ipAddress: getRequestIP(event, { xForwardedFor: true }) || null,
        userAgent: getRequestHeader(event, 'user-agent') || null,
    })

    return success(result)
})
