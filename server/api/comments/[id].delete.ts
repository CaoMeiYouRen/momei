import { dataSource } from '@/server/database'
import { Comment } from '@/server/entities/comment'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID required' })
    }

    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session?.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const commentRepo = dataSource.getRepository(Comment)
    const comment = await commentRepo.findOne({ where: { id }, relations: ['post'] })

    if (!comment) {
        throw createError({ statusCode: 404, statusMessage: 'Comment not found' })
    }

    const isSystemAdmin = isAdmin(session.user.role)
    const isPostAuthor = comment.post.authorId === session.user.id
    const isCommentAuthor = comment.authorId === session.user.id

    if (!isSystemAdmin && !isPostAuthor && !isCommentAuthor) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    await commentRepo.delete(id)

    return {
        code: 200,
        message: 'Comment deleted',
    }
})
