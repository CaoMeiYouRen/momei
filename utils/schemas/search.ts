import { z } from 'zod'
import { paginationSchema } from './pagination'

export const searchQuerySchema = paginationSchema.extend({
    q: z.string().optional(),
    language: z.string().optional(),
    category: z.string().optional(),
    tags: z.preprocess(
        (val) => {
            if (!val) {
                return []
            }
            if (typeof val === 'string') {
                return [val]
            }
            return val
        },
        z.array(z.string()).optional(),
    ),
    sortBy: z.enum(['relevance', 'publishedAt', 'views']).default('relevance'),
})

export type SearchQuery = z.infer<typeof searchQuerySchema>
