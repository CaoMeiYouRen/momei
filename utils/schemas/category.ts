import { z } from 'zod'
import { paginationSchema, sortingSchema } from './pagination'
import { taxonomyNameAndSlug, taxonomyLanguageAndTranslation } from './taxonomy'

export const categoryBodySchema = z.object({
    ...taxonomyNameAndSlug,
    description: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(),
    language: z.string().default('zh-CN'),
    translationId: z.string().max(255).nullable().optional(),
})

export const categoryUpdateSchema = categoryBodySchema.partial().extend({
    slug: taxonomyNameAndSlug.slug.optional(),
})

export const categoryQuerySchema = paginationSchema.extend(sortingSchema.shape).extend({
    ...taxonomyLanguageAndTranslation,
    search: z.string().optional(),
    parentId: z.string().optional(),
    aggregate: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
})
