import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'
import { User } from '@/server/entities/user'
import { subscribeSchema } from '@/utils/schemas/subscriber'
import { emailService } from '@/server/utils/email/service'
import logger from '@/server/utils/logger'
import { assignDefined } from '@/server/utils/object'
import { notifyAdmins } from '@/server/services/notification'
import { AdminNotificationEvent } from '@/utils/shared/notification'

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

    // 检查是否存在对应的正式用户
    const userRepo = dataSource.getRepository(User)
    const user = await userRepo.findOne({ where: { email } })

    const subscriberRepo = dataSource.getRepository(Subscriber)
    const existing = await subscriberRepo.findOne({ where: { email } })
    let isNewSub = false

    if (existing) {
        if (existing.isActive) {
            // 如果已存在且活跃，更新关联信息
            existing.userId = user?.id || existing.userId
            existing.language = language
            await subscriberRepo.save(existing)
            return {
                code: 200,
                message: 'Already subscribed',
            }
        }
        existing.isActive = true
        existing.language = language
        existing.userId = user?.id || null
        await subscriberRepo.save(existing)
        isNewSub = true
    } else {
        const subscriber = new Subscriber()
        assignDefined(subscriber, result.data, ['email', 'language'])
        subscriber.userId = user?.id || null
        await subscriberRepo.save(subscriber)
        isNewSub = true
    }

    if (isNewSub) {
        notifyAdmins(AdminNotificationEvent.NEW_USER, {
            title: '新订阅者',
            content: `<p>新用户 <strong>${email}</strong> 已订阅您的博客。</p>`,
        }).catch((err) => {
            console.error('Failed to notify admins of new subscriber:', err)
        })
    }

    // 发送订阅确认邮件
    try {
        await emailService.sendSubscriptionConfirmation(email)
    } catch (error) {
        // 邮件发送失败不影响订阅状态，但记录日志
        logger.email.failed({
            type: 'subscription-confirm',
            email,
            error: error instanceof Error ? error.message : String(error),
        })
    }

    return {
        code: 200,
        message: 'Successfully subscribed',
    }
})
