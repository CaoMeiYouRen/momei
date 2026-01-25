import { commentService } from '@/server/services/comment'
import { verifyCookieValue } from '@/server/utils/security'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const postId = getRouterParam(event, 'id')
    if (!postId) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID required' })
    }

    const session = event.context?.auth

    const isUserAdmin = session?.user && isAdmin(session.user.role)

    // 尝试从 Cookie 中获取游客邮箱（用于展示其待审核评论）
    // 校验签名以确保邮箱未被伪造
    const signedGuestEmail = getCookie(event, 'momei_guest_email')
    const guestEmail = verifyCookieValue(signedGuestEmail)

    const comments = await commentService.getCommentsByPostId(postId, {
        isAdmin: isUserAdmin,
        viewerEmail: (session?.user?.email || guestEmail) ?? undefined,
        viewerId: session?.user?.id,
    })

    return {
        code: 200,
        data: comments,
    }
})
