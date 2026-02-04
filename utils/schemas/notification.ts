import { z } from 'zod'
import { NotificationType, NotificationChannel } from '../shared/notification'

export const notificationSettingSchema = z.object({
    type: z.enum(Object.values(NotificationType) as [string, ...string[]]),
    channel: z.enum(Object.values(NotificationChannel) as [string, ...string[]]),
    isEnabled: z.boolean(),
})

export const updateNotificationSettingsSchema = z.array(notificationSettingSchema)

export const marketingCampaignSchema = z.object({
    title: z.string().min(1).max(255),
    content: z.string().min(1),
    targetCriteria: z.object({
        categoryIds: z.array(z.string()).optional(),
        tagIds: z.array(z.string()).optional(),
    }).optional().default({}),
})

export type NotificationSettingInput = z.infer<typeof notificationSettingSchema>
export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>
export type MarketingCampaignInput = z.infer<typeof marketingCampaignSchema>
