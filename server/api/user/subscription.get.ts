import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'
import { requireAuth } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)
    const userId = session.user.id

    const subscriberRepo = dataSource.getRepository(Subscriber)
    const subscriber = await subscriberRepo.findOne({
        where: { userId },
    })

    if (!subscriber) {
        // 如果用户尚未订阅，返回默认值
        return {
            code: 200,
            data: {
                subscribedCategoryIds: [],
                subscribedTagIds: [],
                isMarketingEnabled: true,
                isActive: false,
            },
        }
    }

    return {
        code: 200,
        data: {
            subscribedCategoryIds: subscriber.subscribedCategoryIds || [],
            subscribedTagIds: subscriber.subscribedTagIds || [],
            isMarketingEnabled: subscriber.isMarketingEnabled,
            isActive: subscriber.isActive,
        },
    }
})
