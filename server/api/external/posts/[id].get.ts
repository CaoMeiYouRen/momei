import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const id = getRouterParam(event, 'id')

    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOne({
        where: { id },
        relations: ['category', 'tags', 'author'],
    })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    // 权限检查
    if (!isAdmin(user.role) && post.authorId !== user.id) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // 处理敏感信息（如密码）
     
    const { password: _, ...safePost } = post

    return {
        code: 200,
        data: safePost,
    }
})
