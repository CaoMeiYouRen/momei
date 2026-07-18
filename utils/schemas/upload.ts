import { z } from 'zod'

export const uploadTypeSchema = z.enum(['image', 'audio', 'file'])

export const uploadQuerySchema = z.object({
    type: uploadTypeSchema.optional().default('image'),
    prefix: z.string().trim().max(200).optional().or(z.literal('')),
})

export const directUploadRequestSchema = z.object({
    filename: z.string().min(1).max(255),
    contentType: z.string().min(1).max(255),
    size: z.number().int().positive(),
    type: uploadTypeSchema.optional(),
    prefix: z.string().max(255).optional(),
})

export type UploadQueryInput = z.infer<typeof uploadQuerySchema>
export type DirectUploadRequestInput = z.infer<typeof directUploadRequestSchema>
