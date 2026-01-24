import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { isAdmin } from '@/utils/shared/roles'
import { requireAdminOrAuthor } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const session = await requireAdminOrAuthor(event)
    const { user } = session

    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOne({ where: { id } })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    // Permission check
    const isAuthor = user.id === post.authorId
    const isUserAdmin = isAdmin(user.role)
    if (!isAuthor && !isUserAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    await postRepo.remove(post)

    return {
        code: 200,
        message: 'Post deleted',
    }
})
