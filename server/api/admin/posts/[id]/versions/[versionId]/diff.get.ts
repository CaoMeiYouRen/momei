import { success } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { isAdmin } from '@/utils/shared/roles'
import { getPostVersionDiffService } from '@/server/services/post-version'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const versionId = getRouterParam(event, 'versionId')

    if (!id || !versionId) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID and Version ID are required' })
    }

    const session = await requireAdminOrAuthor(event)
    const query = getQuery(event)
    const compareToVersionId = typeof query.compareToVersionId === 'string' ? query.compareToVersionId : null
    const compareToCurrent = query.compareToCurrent === 'true'

    const diff = await getPostVersionDiffService(id, versionId, {
        currentUserId: session.user.id,
        isAdmin: isAdmin(session.user.role),
    }, {
        compareToVersionId,
        compareToCurrent,
    })

    return success(diff)
})
