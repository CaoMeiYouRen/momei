import { commentService } from '@/server/services/comment'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const postId = getRouterParam(event, 'id')
    if (!postId) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID required' })
    }

    const session = await auth.api.getSession({
        headers: event.headers,
    })

    const isUserAdmin = session?.user && isAdmin(session.user.role)

    const comments = await commentService.getCommentsByPostId(postId, {
        isAdmin: isUserAdmin,
    })

    return {
        code: 200,
        data: comments,
    }
})
