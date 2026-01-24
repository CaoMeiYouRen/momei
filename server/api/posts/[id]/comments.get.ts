import { commentService } from '@/server/services/comment'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const postId = getRouterParam(event, 'id')
    if (!postId) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID required' })
    }

    const session = event.context.auth

    const isUserAdmin = session?.user && isAdmin(session.user.role)

    // 尝试从 Cookie 中获取游客邮箱（用于展示其待审核评论）
    const guestEmail = getCookie(event, 'momei_guest_email')

    const comments = await commentService.getCommentsByPostId(postId, {
        isAdmin: isUserAdmin,
        viewerEmail: session?.user?.email || guestEmail,
        viewerId: session?.user?.id,
    })

    return {
        code: 200,
        data: comments,
    }
})
