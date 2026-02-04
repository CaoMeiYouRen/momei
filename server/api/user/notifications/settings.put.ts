import { dataSource } from '@/server/database'
import { NotificationSettings } from '@/server/entities/notification-settings'
import { requireAuth } from '@/server/utils/permission'
import { updateNotificationSettingsSchema } from '@/utils/schemas/notification'

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)
    const userId = session.user.id

    const result = await readValidatedBody(event, (body) => updateNotificationSettingsSchema.safeParse(body))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }

    const settingsRepo = dataSource.getRepository(NotificationSettings)

    for (const item of result.data) {
        let setting = await settingsRepo.findOne({
            where: {
                userId,
                type: item.type,
                channel: item.channel,
            },
        })

        if (!setting) {
            setting = new NotificationSettings()
            setting.userId = userId
            setting.type = item.type
            setting.channel = item.channel
        }

        setting.isEnabled = item.isEnabled
        await settingsRepo.save(setting)
    }

    return {
        code: 200,
        message: 'Notification settings updated successfully',
    }
})
