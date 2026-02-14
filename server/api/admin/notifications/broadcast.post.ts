import { z } from 'zod'
import { sendInAppNotification } from '@/server/services/notification'
import { requireAdmin } from '@/server/utils/permission'
import { NotificationType } from '@/utils/shared/notification'

const bodySchema = z.object({
    title: z.string().min(1).max(255),
    content: z.string().min(1),
    link: z.url().optional().nullable(),
})

export default eventHandler(async (event) => {
    await requireAdmin(event)
    const body = await readValidatedBody(event, bodySchema.parse)

    const notification = await sendInAppNotification({
        userId: null, // 全局广播
        type: NotificationType.SYSTEM,
        title: body.title,
        content: body.content,
        link: body.link,
    })

    return {
        code: 200,
        message: 'Broadcast sent successfully',
        data: notification,
    }
})
