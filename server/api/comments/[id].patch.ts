import { dataSource } from '@/server/database'
import { Comment } from '@/server/entities/comment'
import { CommentStatus } from '@/types/comment'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { status, isSticked } = body

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID required' })
    }

    await requireAdmin(event)

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
