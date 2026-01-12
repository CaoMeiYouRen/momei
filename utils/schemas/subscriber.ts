import { z } from 'zod'

export const subscribeSchema = z.object({
    email: z.email({ message: 'Invalid email address' }),
    language: z.string().optional().default('zh-CN'),
})

export type SubscribeInput = z.infer<typeof subscribeSchema>
