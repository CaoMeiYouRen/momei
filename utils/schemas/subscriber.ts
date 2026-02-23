import { z } from 'zod'
import { isSnowflakeId } from '../shared/validate'

export const subscribeSchema = z.object({
    email: z.email({ message: 'Invalid email address' }),
    language: z.string().optional().default('zh-CN'),
})

export const updateSubscriptionSchema = z.object({
    subscribedCategoryIds: z.array(z.string()).optional(),
    subscribedTagIds: z.array(z.string()).optional(),
    isMarketingEnabled: z.boolean().optional(),
    isActive: z.boolean().optional(),
})

export const subscriberIdSchema = z.object({
    id: z.string().trim().refine((value) => isSnowflakeId(value), {
        message: 'Invalid subscriber id',
    }),
})

export const subscriberListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    email: z.preprocess(
        (value) => {
            if (typeof value !== 'string') {
                return value
            }

            const trimmed = value.trim()
            return trimmed.length > 0 ? trimmed : undefined
        },
        z.string().max(255).optional(),
    ),
})

export const updateSubscriberSchema = z.object({
    isActive: z.boolean().optional(),
    language: z.string().trim().min(2).max(10).optional(),
    userId: z.string().trim().refine((value) => isSnowflakeId(value), {
        message: 'Invalid userId',
    }).nullable().optional(),
})

export type SubscribeInput = z.infer<typeof subscribeSchema>
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>
export type SubscriberIdInput = z.infer<typeof subscriberIdSchema>
export type SubscriberListQuery = z.infer<typeof subscriberListQuerySchema>
export type UpdateSubscriberInput = z.infer<typeof updateSubscriberSchema>
