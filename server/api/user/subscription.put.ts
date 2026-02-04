import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'
import { requireAuth } from '@/server/utils/permission'
import { updateSubscriptionSchema } from '@/utils/schemas/subscriber'
import { assignDefined } from '@/server/utils/object'

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)
    const userId = session.user.id
    const userEmail = session.user.email

    const result = await readValidatedBody(event, (body) => updateSubscriptionSchema.safeParse(body))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }

    const subscriberRepo = dataSource.getRepository(Subscriber)
    let subscriber = await subscriberRepo.findOne({
        where: { userId },
    })

    if (!subscriber) {
        // 如果没有通过 userId 找到，尝试通过 email 找到并绑定
        subscriber = await subscriberRepo.findOne({
            where: { email: userEmail },
        })

        if (!subscriber) {
            // 如果还是没有，创建一个新的
            subscriber = new Subscriber()
            subscriber.email = userEmail
            subscriber.userId = userId
            subscriber.isActive = true // 用户主动设置订阅，通常视为激活
        } else {
            // 绑定 userId
            subscriber.userId = userId
        }
    }

    assignDefined(subscriber, result.data, [
        'subscribedCategoryIds',
        'subscribedTagIds',
        'isMarketingEnabled',
        'isActive',
    ])

    await subscriberRepo.save(subscriber)

    return {
        code: 200,
        message: 'Subscription updated successfully',
        data: {
            subscribedCategoryIds: subscriber.subscribedCategoryIds || [],
            subscribedTagIds: subscriber.subscribedTagIds || [],
            isMarketingEnabled: subscriber.isMarketingEnabled,
            isActive: subscriber.isActive,
        },
    }
})
