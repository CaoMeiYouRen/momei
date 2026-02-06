import { dataSource } from '@/server/database'
import { AdminNotificationSettings } from '@/server/entities/admin-notification-settings'
import { requireAdmin } from '@/server/utils/permission'
import { AdminNotificationEvent } from '@/utils/shared/notification'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const repo = dataSource.getRepository(AdminNotificationSettings)
    const settings = await repo.find()

    // Ensure all events have at least a default entry in the response
    const events = Object.values(AdminNotificationEvent)
    const result = events.map((ev) => {
        const existing = settings.find((s) => s.event === ev)
        return existing || {
            event: ev,
            isEmailEnabled: true,
            isBrowserEnabled: false,
        }
    })

    return {
        code: 200,
        data: result,
    }
})
