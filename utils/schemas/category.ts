import { z } from 'zod'
import { isSnowflakeId } from '../shared/validate'
import { paginationSchema, sortingSchema } from './pagination'

export const categoryBodySchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).refine((s) => !isSnowflakeId(s), {
        message: 'Slug cannot be a Snowflake ID format',
    }),
    description: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(),
    language: z.string().default('zh-CN'),
    translationId: z.string().max(255).nullable().optional(),
})

export const categoryUpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(100).refine((s) => !isSnowflakeId(s), {
        message: 'Slug cannot be a Snowflake ID format',
    }).optional(),
    description: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(),
    language: z.string().optional(),
    translationId: z.string().max(255).nullable().optional(),
})

export const categoryQuerySchema = paginationSchema.extend(sortingSchema.shape).extend({
    search: z.string().optional(),
    parentId: z.string().optional(),
    language: z.string().optional(),
    aggregate: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
})
