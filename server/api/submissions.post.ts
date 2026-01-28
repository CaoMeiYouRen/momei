import { submissionService } from '@/server/services/submission'
import { submissionSchema } from '@/utils/schemas/submission'
import { rateLimit } from '@/server/utils/rate-limit'
import { verifyCaptcha } from '@/server/utils/captcha'

export default defineEventHandler(async (event) => {
    // 1. 限频：单 IP 24 小时内限制提交 3 次
    await rateLimit(event, { window: 86400, max: 3 })

    const result = await readValidatedBody(event, (body) => submissionSchema.safeParse(body))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }

    const { captchaToken, ...data } = result.data

    // 2. 验证验证码
    const isValid = await verifyCaptcha(captchaToken)
    if (!isValid) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Captcha verification failed',
        })
    }

    // 3. 获取 IP 和 User Agent
    const ip = getRequestIP(event, { xForwardedFor: true })
    const userAgent = getRequestHeader(event, 'user-agent')

    // 4. 如果用户已登录，关联其用户 ID
    const user = event.context.user
    const authorId = user?.id || null

    // 5. 创建投稿
    try {
        const submission = await submissionService.createSubmission({
            ...data,
            authorId,
            ip,
            userAgent,
        })

        return {
            code: 200,
            message: 'Submission successful',
            data: { id: submission.id },
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Internal Server Error',
        })
    }
})
