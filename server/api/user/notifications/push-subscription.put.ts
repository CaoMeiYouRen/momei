import { requireAuth } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { upsertWebPushSubscription } from '@/server/services/web-push'
import { webPushSubscriptionSchema } from '@/utils/schemas/notification'

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)
    const body = await readValidatedBody(event, (payload) => webPushSubscriptionSchema.parse(payload))

    const subscription = await upsertWebPushSubscription({
        userId: session.user.id,
        subscription: {
            endpoint: body.endpoint,
            expirationTime: body.expirationTime,
            keys: body.keys,
        },
        permission: body.permission,
        userAgent: getRequestHeader(event, 'user-agent') || null,
        locale: event.context.locale || null,
    })

    return success({
        endpoint: subscription?.endpoint || body.endpoint,
    })
})
