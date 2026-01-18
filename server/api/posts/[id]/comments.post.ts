import { commentService } from '@/server/services/comment'
import { auth } from '@/lib/auth'

export default defineEventHandler(async (event) => {
    const postId = getRouterParam(event, 'id')
    if (!postId) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID required' })
    }

    const body = await readBody(event)
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    const commentData: any = {
        postId,
        parentId: body.parentId,
        content: body.content,
        ip: getRequestIP(event),
        userAgent: getRequestHeader(event, 'user-agent'),
    }

    if (session?.user) {
        commentData.authorId = session.user.id
        commentData.authorName = session.user.name
        commentData.authorEmail = session.user.email
        commentData.authorUrl = null // 待从 User 实体扩展
    } else {
        // 游客评论
        if (!body.authorName || !body.authorEmail) {
            throw createError({ statusCode: 400, statusMessage: 'Name and Email are required for guests' })
        }
        commentData.authorName = body.authorName
        commentData.authorEmail = body.authorEmail
        commentData.authorUrl = body.authorUrl
    }

    if (!commentData.content) {
        throw createError({ statusCode: 400, statusMessage: 'Comment content is required' })
    }

    const comment = await commentService.createComment(commentData)

    return {
        code: 201,
        data: comment,
    }
})
