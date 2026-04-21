import { z } from 'zod'
import { getDemoNotificationDeliveryLogsPreview } from '@/server/utils/demo-settings'
import { getNotificationDeliveryLogs } from '@/server/services/notification-delivery'
import { requireAdmin } from '@/server/utils/permission'
import { safeParsePaginatedQuery } from '@/server/utils/pagination'
import { success } from '@/server/utils/response'
import { NotificationDeliveryChannel, NotificationDeliveryStatus, NotificationType } from '@/utils/shared/notification'

const dateQuerySchema = z.preprocess((value) => {
    if (!value) {
        return undefined
    }

    if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
        return undefined
    }

    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
}, z.date().optional())

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    notificationType: z.enum(NotificationType).optional(),
    channel: z.enum(NotificationDeliveryChannel).optional(),
    status: z.enum(NotificationDeliveryStatus).optional(),
    recipient: z.string().trim().min(1).optional(),
    startDate: dateQuerySchema,
    endDate: dateQuerySchema,
})

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const query = safeParsePaginatedQuery(querySchema, getQuery(event))

    if (useRuntimeConfig().public.demoMode) {
        return success(getDemoNotificationDeliveryLogsPreview(query.page, query.limit))
    }

    const data = await getNotificationDeliveryLogs(query)

    return success({
        ...data,
        demoPreview: false,
    })
})
