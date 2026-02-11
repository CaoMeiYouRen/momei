import { success } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { deletePostVersionService } from '@/server/services/post'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const versionId = getRouterParam(event, 'versionId')

    if (!id || !versionId) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID and Version ID are required' })
    }

    // 鉴权
    const session = await requireAdminOrAuthor(event)

    await deletePostVersionService(
        versionId,
        session.user.id,
        isAdmin(session.user.role),
    )

    return success({ message: 'Version deleted successfully' })
})
