import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm'
import { buildRuntimeApiCacheKey } from '@/server/utils/api-runtime-cache'

type QuerySortOrder = 'ASC' | 'DESC'

function normalizeQuerySortOrder(order?: null | string): QuerySortOrder {
    return order === 'ASC' ? 'ASC' : 'DESC'
}

export interface TaxonomyPublicListQuery {
    aggregate?: boolean
    language?: null | string
    limit: number
    order?: null | string
    orderBy?: null | string
    page: number
    search?: null | string
    translationId?: null | string
}

interface BuildTaxonomyPublicListCacheKeyOptions {
    namespace: string
    query: TaxonomyPublicListQuery
    extraSegments?: (number | string)[]
}

interface ApplyTaxonomyPublicListFiltersOptions {
    aggregate?: boolean
    alias: string
    language?: null | string
    search?: null | string
    translationId?: null | string
}

interface ApplyTaxonomyPublicListOrderingOptions {
    alias: string
    order?: null | string
    orderBy?: null | string
    postCountAlias: string
}

export function buildTaxonomyPublicListCacheKey(options: BuildTaxonomyPublicListCacheKeyOptions) {
    const { extraSegments = [], namespace, query } = options

    return buildRuntimeApiCacheKey(
        namespace,
        query.aggregate ? '1' : '0',
        query.language ?? 'all',
        ...extraSegments,
        query.translationId ?? 'all',
        query.search ?? '',
        query.orderBy ?? 'createdAt',
        query.order ?? 'DESC',
        query.page,
        query.limit,
    )
}

export function applyTaxonomyPublicListFilters<Entity extends ObjectLiteral>(
    qb: SelectQueryBuilder<Entity>,
    options: ApplyTaxonomyPublicListFiltersOptions,
) {
    const {
        aggregate,
        alias,
        language,
        search,
        translationId,
    } = options

    if (search) {
        qb.andWhere(`${alias}.name LIKE :search`, { search: `%${search}%` })
    }

    if (translationId) {
        qb.andWhere(`COALESCE(${alias}.translationId, ${alias}.slug) = :translationId`, {
            translationId,
        })
    }

    if (language && !aggregate) {
        qb.andWhere(`${alias}.language = :language`, { language })
    }

    return qb
}

export function applyTaxonomyPublicListOrdering<Entity extends ObjectLiteral>(
    qb: SelectQueryBuilder<Entity>,
    options: ApplyTaxonomyPublicListOrderingOptions,
) {
    const {
        alias,
        order,
        orderBy,
        postCountAlias,
    } = options

    if (orderBy === 'postCount') {
        qb.orderBy(postCountAlias, normalizeQuerySortOrder(order))
        return qb
    }

    qb.orderBy(`${alias}.${orderBy || 'createdAt'}`, normalizeQuerySortOrder(order))
    return qb
}
