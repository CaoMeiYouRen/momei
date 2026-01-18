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

    const query = getQuery(event)
    const email = query.email as string
    const isUserAdmin = session?.user && isAdmin(session.user.role)

    const comments = await commentService.getCommentsByPostId(postId, {
        isAdmin: isUserAdmin,
        viewerEmail: email || session?.user?.email,
        viewerId: session?.user?.id,
    })

    return {
        code: 200,
        data: comments,
    }
})
