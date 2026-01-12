import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOne({ where: { id } })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    // Permission check
    const isAuthor = session.user.id === post.authorId
    const isUserAdmin = isAdmin(session.user.role)
    if (!isAuthor && !isUserAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    await postRepo.remove(post)

    return {
        code: 200,
        message: 'Post deleted',
    }
})
