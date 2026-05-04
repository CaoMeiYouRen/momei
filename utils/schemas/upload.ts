import { z } from 'zod'

export const uploadQuerySchema = z.object({
    type: z.enum(['image', 'audio', 'file']).optional().default('image'),
    prefix: z.string().trim().max(200).optional().or(z.literal('')),
})

export type UploadQueryInput = z.infer<typeof uploadQuerySchema>
