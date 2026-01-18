import { dataSource } from '@/server/database'
import { Comment } from '@/server/entities/comment'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/utils/shared/roles'
import { CommentStatus } from '@/types/comment'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { status, isSticked } = body

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID required' })
    }

    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session?.user || !isAdmin(session.user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }

    const commentRepo = dataSource.getRepository(Comment)
    const comment = await commentRepo.findOne({ where: { id } })

    if (!comment) {
        throw createError({ statusCode: 404, statusMessage: 'Comment not found' })
    }

    if (status !== undefined) {
        comment.status = status as CommentStatus
    }
    if (isSticked !== undefined) {
        comment.isSticked = !!isSticked
    }

    await commentRepo.save(comment)

    return {
        code: 200,
        data: comment,
    }
})
