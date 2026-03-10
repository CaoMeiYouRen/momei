import { dataSource } from '@/server/database'
import { AdminNotificationSettings } from '@/server/entities/admin-notification-settings'
import { requireAdmin } from '@/server/utils/permission'
import { setSettings } from '@/server/services/setting'
import { SettingKey } from '@/types/setting'
import { updateAdminNotificationSettingsPayloadSchema } from '@/utils/schemas/notification'

export default defineEventHandler(async (event) => {
    const session = await requireAdmin(event)

    const payload = await readValidatedBody(event, (body) => updateAdminNotificationSettingsPayloadSchema.parse(body))

    const repo = dataSource.getRepository(AdminNotificationSettings)

    for (const item of payload.items) {
        let setting = await repo.findOne({ where: { event: item.event } })
        if (!setting) {
            setting = new AdminNotificationSettings()
            setting.event = item.event
        }
        setting.isEmailEnabled = item.isEmailEnabled
        setting.isBrowserEnabled = item.isBrowserEnabled
        await repo.save(setting)
    }

    if (payload.webPush) {
        await setSettings({
            [SettingKey.WEB_PUSH_VAPID_SUBJECT]: payload.webPush.subject,
            [SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY]: payload.webPush.publicKey,
        }, {
            operatorId: session.user.id,
            ipAddress: getRequestIP(event, { xForwardedFor: true }) || null,
            userAgent: getRequestHeader(event, 'user-agent') || null,
            reason: 'admin_notification_web_push_update',
            source: 'admin_ui',
        })
    }

    return {
        code: 200,
        message: 'Admin notification settings updated successfully',
    }
})
