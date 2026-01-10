import type { SelectQueryBuilder, ObjectLiteral } from 'typeorm'
import { paginationSchema } from '@/utils/schemas/pagination'

export interface PaginationOptions {
    page: number
    limit: number
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
        page: 1,
        limit: 10,
    }
}
