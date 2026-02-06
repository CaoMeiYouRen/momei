import { dataSource } from '@/server/database'
import { AdminNotificationSettings } from '@/server/entities/admin-notification-settings'
import { requireAdmin } from '@/server/utils/permission'
import { updateAdminNotificationSettingsSchema } from '@/utils/schemas/notification'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const result = await readValidatedBody(event, (body) => updateAdminNotificationSettingsSchema.safeParse(body))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }

    const repo = dataSource.getRepository(AdminNotificationSettings)

    for (const item of result.data) {
        let setting = await repo.findOne({ where: { event: item.event } })
        if (!setting) {
            setting = new AdminNotificationSettings()
            setting.event = item.event
        }
        setting.isEmailEnabled = item.isEmailEnabled
        setting.isBrowserEnabled = item.isBrowserEnabled
        await repo.save(setting)
    }

    return {
        code: 200,
        message: 'Admin notification settings updated successfully',
    }
})
