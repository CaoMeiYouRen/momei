import { dataSource } from '@/server/database'
import { NotificationSettings } from '@/server/entities/notification-settings'
import { requireAuth } from '@/server/utils/permission'
import { NotificationType, NotificationChannel } from '@/utils/shared/notification'

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)
    const userId = session.user.id

    const settingsRepo = dataSource.getRepository(NotificationSettings)
    const existingSettings = await settingsRepo.find({
        where: { userId },
    })

    // 定义所有可能的组合
    const allTypes = Object.values(NotificationType)
    const allChannels = Object.values(NotificationChannel)

    const result: any[] = []

    for (const type of allTypes) {
        for (const channel of allChannels) {
            const existing = existingSettings.find((s) => s.type === type && s.channel === channel)
            result.push({
                type,
                channel,
                isEnabled: existing ? existing.isEnabled : true, // 默认为开启
            })
        }
    }

    return {
        code: 200,
        data: result,
    }
})
