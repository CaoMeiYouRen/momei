import { z } from 'zod'
import { isSnowflakeId } from '../shared/validate'

export const categoryBodySchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).refine((s) => !isSnowflakeId(s), {
        message: 'Slug cannot be a Snowflake ID format',
    }),
    description: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(),
    language: z.string().default('zh'),
})

export const categoryUpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(100).refine((s) => !isSnowflakeId(s), {
        message: 'Slug cannot be a Snowflake ID format',
    }).optional(),
    description: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(),
    language: z.string().optional(),
})

export const categoryQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    parentId: z.string().optional(),
    language: z.string().optional(),
})
