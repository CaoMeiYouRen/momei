import { dataSource } from '@/server/database'
import { AdminNotificationSettings } from '@/server/entities/admin-notification-settings'
import { getDemoAdminNotificationSettingsPreview } from '@/server/utils/demo-settings'
import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { getSetting, resolveSetting } from '@/server/services/setting'
import { SettingKey } from '@/types/setting'
import { AdminNotificationEvent } from '@/utils/shared/notification'

function toWebPushSetting(item: Awaited<ReturnType<typeof resolveSetting>>) {
    return {
        value: item.value || '',
        source: item.source,
        isLocked: item.isLocked,
        envKey: item.envKey,
        defaultUsed: item.defaultUsed,
        lockReason: item.lockReason,
        requiresRestart: item.requiresRestart,
    }
}

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    if (useRuntimeConfig().public.demoMode) {
        return success(getDemoAdminNotificationSettingsPreview())
    }

    const repo = dataSource.getRepository(AdminNotificationSettings)
    const settings = await repo.find()
    const [subjectSetting, publicKeySetting] = await Promise.all([
        resolveSetting(
            SettingKey.WEB_PUSH_VAPID_SUBJECT,
        ),
        resolveSetting(
            SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY,
        ),
    ])
    const privateKeyConfigured = Boolean(await getSetting(SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY))

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

    return success({
        items: result,
        webPush: {
            subject: toWebPushSetting(subjectSetting),
            publicKey: toWebPushSetting(publicKeySetting),
            privateKeyConfigured,
            isConfigured: Boolean(subjectSetting.value && publicKeySetting.value && privateKeyConfigured),
        },
        demoPreview: false,
    })
})
