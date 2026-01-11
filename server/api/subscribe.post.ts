import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'
import { subscribeSchema } from '@/utils/schemas/subscriber'
import { emailService } from '@/server/utils/email/service'

export default defineEventHandler(async (event) => {
    const result = await readValidatedBody(event, (body) => subscribeSchema.safeParse(body))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }

    const { email, language } = result.data

    const subscriberRepo = dataSource.getRepository(Subscriber)
    const existing = await subscriberRepo.findOne({ where: { email } })

    if (existing) {
        if (existing.isActive) {
            return {
                code: 200,
                message: 'Already subscribed',
            }
        }
        existing.isActive = true
        existing.language = language
        await subscriberRepo.save(existing)
    } else {
        const subscriber = new Subscriber()
        subscriber.email = email
        subscriber.language = language
        await subscriberRepo.save(subscriber)
    }

    // 发送订阅确认邮件
    try {
        await emailService.sendSubscriptionConfirmation(email)
    } catch (error) {
        // 邮件发送失败不影响订阅状态，但记录日志
        console.error('Failed to send subscription confirmation email:', error)
    }

    return {
        code: 200,
        message: 'Successfully subscribed',
    }
})
