import { success } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { getPostVersionsService } from '@/server/services/post'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID is required' })
    }

    // 鉴权：仅具有管理员或作者角色的用户可访问
    await requireAdminOrAuthor(event)

    const versions = await getPostVersionsService(id)

    return success(versions)
})
