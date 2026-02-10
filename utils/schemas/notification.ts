import { z } from 'zod'
import { NotificationType, NotificationChannel, MarketingCampaignType, AdminNotificationEvent } from '../shared/notification'

export const notificationSettingSchema = z.object({
    type: z.enum(NotificationType),
    channel: z.enum(NotificationChannel),
    isEnabled: z.boolean(),
})

export const updateNotificationSettingsSchema = z.array(notificationSettingSchema)

export const marketingCampaignSchema = z.object({
    title: z.string().min(1).max(255),
    content: z.string().min(1),
    type: z.enum(MarketingCampaignType).default(MarketingCampaignType.FEATURE),
    targetCriteria: z.object({
        categoryIds: z.array(z.string()).optional(),
        tagIds: z.array(z.string()).optional(),
    }).optional().default({}),
    scheduledAt: z.coerce.date().optional().nullable(),
})

export type NotificationSettingInput = z.infer<typeof notificationSettingSchema>
export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>
export type MarketingCampaignInput = z.infer<typeof marketingCampaignSchema>

export const adminNotificationSettingSchema = z.object({
    event: z.enum(AdminNotificationEvent),
    isEmailEnabled: z.boolean(),
    isBrowserEnabled: z.boolean(),
})

export const updateAdminNotificationSettingsSchema = z.array(adminNotificationSettingSchema)

export type AdminNotificationSettingInput = z.infer<typeof adminNotificationSettingSchema>
export type UpdateAdminNotificationSettingsInput = z.infer<typeof updateAdminNotificationSettingsSchema>
