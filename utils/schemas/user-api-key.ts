import { z } from 'zod'

export const userApiKeySchema = z.object({
    name: z.string().min(1).max(50),
    expiresIn: z.enum(['never', '7d', '30d', '365d']).optional().default('never'),
})

export type UserApiKeyInput = z.infer<typeof userApiKeySchema>
