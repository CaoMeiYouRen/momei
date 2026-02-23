import { commentService } from '@/server/services/comment'
import { signCookieValue } from '@/server/utils/security'
import { commentBodySchema } from '@/utils/schemas/comment'
import { isSnowflakeId } from '@/utils/shared/validate'
import { z } from 'zod'

const postIdParamSchema = z.object({
    postId: z.string().trim().refine((value) => isSnowflakeId(value), {
        message: 'Post ID required',
    }),
})

export default defineEventHandler(async (event) => {
    const { postId } = postIdParamSchema.parse({ postId: getRouterParam(event, 'id') })
    const body = await readValidatedBody(event, (value) => commentBodySchema.parse(value))
    const session = event.context?.auth

    const commentData: Parameters<typeof commentService.createComment>[0] = {
        postId,
        parentId: body.parentId ?? null,
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
        commentData.authorUrl = body.authorUrl ?? null
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
