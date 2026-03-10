import { z } from 'zod'
import { requireAuth } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { removeWebPushSubscription } from '@/server/services/web-push'

const deleteSubscriptionSchema = z.object({
    endpoint: z.url().optional(),
}).default({})

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)
    const body = await readValidatedBody(event, (payload) => deleteSubscriptionSchema.parse(payload ?? {}))

    const removed = await removeWebPushSubscription({
        userId: session.user.id,
        endpoint: body.endpoint,
    })

    return success({ removed })
})
