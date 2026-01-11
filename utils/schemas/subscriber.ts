import { z } from 'zod'

export const subscribeSchema = z.object({
    email: z.string().email('Invalid email address'),
    language: z.string().optional().default('zh'),
})

export type SubscribeInput = z.infer<typeof subscribeSchema>
