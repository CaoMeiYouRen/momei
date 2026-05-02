import { benefitWaitlistService } from '@/server/services/benefit-waitlist'
import { benefitWaitlistSchema } from '@/utils/schemas/benefit-waitlist'
import { rateLimit } from '@/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
    await rateLimit(event, { window: 86400, max: 20 })

    const result = await readValidatedBody(event, (body) => benefitWaitlistSchema.safeParse(body))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }

    const ip = getRequestIP(event, { xForwardedFor: true })
    const userAgent = getRequestHeader(event, 'user-agent')

    try {
        const entry = await benefitWaitlistService.addToWaitlist({
            ...result.data,
            purpose: result.data.purpose || 'benefit',
            ip: ip || null,
            userAgent: userAgent || null,
        })

        return {
            code: 200,
            message: 'Successfully joined the waitlist',
            data: { id: entry.id },
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Internal Server Error',
        })
    }
})
