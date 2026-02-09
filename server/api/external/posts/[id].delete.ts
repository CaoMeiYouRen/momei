import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID is required' })
    }

    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOne({ where: { id } })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    // 权限检查
    if (!isAdmin(user.role) && post.authorId !== user.id) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // 执行删除（项目目前统一使用物理删除还是软删除？查看实体定义）
    // 假设使用仓库默认删除方法
    await postRepo.remove(post)

    return {
        code: 200,
        message: 'Post deleted successfully',
    }
})
