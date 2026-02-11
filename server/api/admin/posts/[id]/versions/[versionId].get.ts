import { success } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { getPostVersionDetailService } from '@/server/services/post'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const versionId = getRouterParam(event, 'versionId')

    if (!id || !versionId) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID and Version ID are required' })
    }

    // 鉴权
    await requireAdminOrAuthor(event)

    const version = await getPostVersionDetailService(versionId)

    return success(version)
})
