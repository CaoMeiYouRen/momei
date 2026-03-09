import { friendLinkService } from '@/server/services/friend-link'
import { rateLimit } from '@/server/utils/rate-limit'
import { success } from '@/server/utils/response'
import { verifyCaptcha } from '@/server/utils/captcha'
import { friendLinkApplicationSchema } from '@/utils/schemas/friend-link'

export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 86400, max: 5 })

    const result = await readValidatedBody(event, (body) => friendLinkApplicationSchema.safeParse(body))
    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }

    const ip = getRequestIP(event, { xForwardedFor: true })
    const userAgent = getRequestHeader(event, 'user-agent')
    const { captchaToken, ...data } = result.data

    const isValid = await verifyCaptcha(captchaToken, ip || undefined)
    if (!isValid) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Captcha verification failed',
        })
    }

    const application = await friendLinkService.createApplication({
        ...data,
        submittedIp: ip,
        submittedUserAgent: userAgent,
    })

    return success({ id: application.id })
})
