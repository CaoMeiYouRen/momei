import { dispatchPostHexoRepositorySyncSchema } from '@/utils/schemas/post-hexo-repository-sync'
import { dispatchPostHexoRepositorySyncService } from '@/server/services/post-hexo-repository-sync'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID is required' })
    }

    const body = await readValidatedBody(event, (value) => dispatchPostHexoRepositorySyncSchema.parse(value))
    const session = await requireAdminOrAuthor(event)

    const result = await dispatchPostHexoRepositorySyncService(id, body, {
        currentUserId: session.user.id,
        isAdmin: isAdmin(session.user.role),
    })

    return success(result)
})
