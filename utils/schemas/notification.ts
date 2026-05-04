import { z } from 'zod'
import { NotificationType, NotificationChannel, MarketingCampaignType, AdminNotificationEvent } from '../shared/notification'
import { paginationSchema } from './pagination'

export const notificationSettingSchema = z.object({
    type: z.enum(NotificationType),
    channel: z.enum(NotificationChannel),
    isEnabled: z.boolean(),
})

export const updateNotificationSettingsSchema = z.array(notificationSettingSchema)

export const webPushSubscriptionSchema = z.object({
    endpoint: z.url(),
    expirationTime: z.number().nullable().optional().default(null),
    keys: z.object({
        p256dh: z.string().min(1),
        auth: z.string().min(1),
    }),
    permission: z.enum(['default', 'granted', 'denied']).optional().default('default'),
})

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

export const marketingCampaignListQuerySchema = paginationSchema

export type NotificationSettingInput = z.infer<typeof notificationSettingSchema>
export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>
export type WebPushSubscriptionInput = z.infer<typeof webPushSubscriptionSchema>
export type MarketingCampaignInput = z.infer<typeof marketingCampaignSchema>
export type MarketingCampaignListQueryInput = z.infer<typeof marketingCampaignListQuerySchema>

export const adminNotificationSettingSchema = z.object({
    event: z.enum(AdminNotificationEvent),
    isEmailEnabled: z.boolean(),
    isBrowserEnabled: z.boolean(),
})

export const updateAdminNotificationSettingsSchema = z.array(adminNotificationSettingSchema)

export const adminNotificationWebPushConfigSchema = z.object({
    subject: z.string().trim().max(255).default(''),
    publicKey: z.string().trim().max(4096).default(''),
})

export const updateAdminNotificationSettingsPayloadSchema = z.union([
    updateAdminNotificationSettingsSchema,
    z.object({
        items: updateAdminNotificationSettingsSchema,
        webPush: adminNotificationWebPushConfigSchema.optional(),
    }),
]).transform((value) => {
    if (Array.isArray(value)) {
        return {
            items: value,
            webPush: undefined,
        }
    }

    return value
})

export type AdminNotificationSettingInput = z.infer<typeof adminNotificationSettingSchema>
export type UpdateAdminNotificationSettingsInput = z.infer<typeof updateAdminNotificationSettingsSchema>
export type AdminNotificationWebPushConfigInput = z.infer<typeof adminNotificationWebPushConfigSchema>
export type UpdateAdminNotificationSettingsPayloadInput = z.infer<typeof updateAdminNotificationSettingsPayloadSchema>
