import { z } from 'zod'
import { paginationSchema, sortingSchema } from './pagination'
import { taxonomyNameAndSlug, taxonomyLanguageAndTranslation } from './taxonomy'

export const tagBodySchema = z.object({
    ...taxonomyNameAndSlug,
    language: z.string().default('zh-CN'),
    translationId: z.string().max(255).nullable().optional(),
})

export const tagUpdateSchema = tagBodySchema.partial().extend({
    slug: taxonomyNameAndSlug.slug.optional(),
})

export const tagQuerySchema = paginationSchema.extend(sortingSchema.shape).extend({
    ...taxonomyLanguageAndTranslation,
    search: z.string().optional(),
    aggregate: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
})
