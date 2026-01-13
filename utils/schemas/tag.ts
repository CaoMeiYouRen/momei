import { z } from 'zod'
import { isSnowflakeId } from '../shared/validate'
import { paginationSchema, sortingSchema } from './pagination'

export const tagBodySchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).refine((s) => !isSnowflakeId(s), {
        message: 'Slug cannot be a Snowflake ID format',
    }),
    language: z.string().default('zh-CN'),
    translationId: z.string().max(255).nullable().optional(),
})

export const tagUpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(100).refine((s) => !isSnowflakeId(s), {
        message: 'Slug cannot be a Snowflake ID format',
    }).optional(),
    language: z.string().optional(),
    translationId: z.string().max(255).nullable().optional(),
})

export const tagQuerySchema = paginationSchema.extend(sortingSchema.shape).extend({
    search: z.string().optional(),
    language: z.string().optional(),
})
