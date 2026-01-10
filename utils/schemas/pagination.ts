import { z } from 'zod'

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
})

export type PaginationQuery = z.infer<typeof paginationSchema>

export const sortingSchema = z.object({
    orderBy: z.string().default('createdAt'),
    order: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type SortingQuery = z.infer<typeof sortingSchema>
