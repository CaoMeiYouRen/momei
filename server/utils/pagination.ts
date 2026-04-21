import type { SelectQueryBuilder, ObjectLiteral } from 'typeorm'
import type { z } from 'zod'
import { paginationSchema } from '@/utils/schemas/pagination'

export interface PaginationOptions {
    page: number
    limit: number
}

const DEFAULT_PAGINATION_LIMIT = 10
const DEFAULT_PAGINATION_OPTIONS: PaginationOptions = {
    page: 1,
    limit: DEFAULT_PAGINATION_LIMIT,
}

function normalizePaginationLimit(limit: unknown) {
    const parsed = Number(limit)
    if (!Number.isFinite(parsed) || parsed < 1) {
        return DEFAULT_PAGINATION_LIMIT
    }

    return Math.min(Math.floor(parsed), 200)
}

export function applyDefaultPaginationLimit<T extends Record<string, unknown>>(query: T, defaultLimit: unknown) {
    if (query.limit !== undefined && query.limit !== null && query.limit !== '') {
        return query
    }

    return {
        ...query,
        limit: normalizePaginationLimit(defaultLimit),
    }
}

/**
 * 为 TypeORM QueryBuilder 应用分页设置
 * @param qb SelectQueryBuilder
 * @param options 分页参数
 */
export function applyPagination<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, options: PaginationOptions) {
    const { page, limit } = options
    qb.skip((page - 1) * limit)
    qb.take(limit)
    return qb
}

/**
 * 解析并验证分页参数
 * @param query 原始查询参数
 */
export function parsePagination(query: any): PaginationOptions {
    const result = paginationSchema.safeParse(query)
    if (result.success) {
        return result.data
    }

    return {
        ...DEFAULT_PAGINATION_OPTIONS,
    }
}

export function safeParsePaginatedQuery<T extends PaginationOptions>(
    schema: z.ZodType<T>,
    query: unknown,
    fallback: PaginationOptions = DEFAULT_PAGINATION_OPTIONS,
): T {
    const result = schema.safeParse(query)
    if (result.success) {
        return result.data
    }

    return {
        ...fallback,
    } as T
}
