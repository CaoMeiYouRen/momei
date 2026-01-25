import { commentService } from '@/server/services/comment'
import { signCookieValue } from '@/server/utils/security'

export default defineEventHandler(async (event) => {
    const postId = getRouterParam(event, 'id')
    if (!postId) {
        throw createError({ statusCode: 400, statusMessage: 'Post ID required' })
    }

    const body = await readBody(event)
    const session = event.context?.auth

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

    // 如果是游客评论，设置一个本地 Cookie 作为身份凭证（有效期 30 天）
    if (!session?.user) {
        // 使用签名增强安全性，防止伪造邮箱查看他人待审核评论
        const signedEmail = signCookieValue(commentData.authorEmail)
        setCookie(event, 'momei_guest_email', signedEmail, {
            httpOnly: false, // 前端可能需要读取展示，采用 value.signature 格式
            maxAge: 30 * 24 * 3600,
            path: '/',
        })
    }

    return {
        code: 201,
        data: comment,
    }
})
