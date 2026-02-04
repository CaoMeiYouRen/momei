import { z } from 'zod'

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

export type SubscribeInput = z.infer<typeof subscribeSchema>
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>
