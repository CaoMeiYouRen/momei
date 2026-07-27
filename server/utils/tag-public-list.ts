/**
 * 标签公开列表查询共享层
 *
 * 消除 `/api/tags` (内部) 与 `/api/external/tags` (外部)
 * 之间的列表查询逻辑重复。
 *
 * ## 职责
 * - 完整的标签公开列表查询（含聚合、过滤、Post Count、排序、分页、翻译附着）
 * - 不关心缓存、认证等外层包装，由调用方（内部/外部 handler）各自处理
 *
 * @see `server/api/tags/index.get.ts`
 * @see `server/api/external/tags/index.get.ts`
 */
import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { applyPagination } from '@/server/utils/pagination'
import { applyTranslationAggregation, attachTranslations } from '@/server/utils/translation'
import { buildTagPostCountSubquery } from '@/server/utils/taxonomy-post-count'
import {
    applyTaxonomyPublicListFilters,
    applyTaxonomyPublicListOrdering,
} from '@/server/utils/taxonomy-public-list'

export interface TagPublicListQuery {
    aggregate?: boolean
    language?: null | string
    limit: number
    order?: null | string
    orderBy?: null | string
    page: number
    search?: null | string
    translationId?: null | string
}

export interface TagPublicListResult {
    items: (Tag & { postCount: number })[]
    total: number
    page: number
    limit: number
}

export async function queryTagPublicList(query: TagPublicListQuery): Promise<TagPublicListResult> {
    const tagRepo = dataSource.getRepository(Tag)
    const baseQueryBuilder = tagRepo.createQueryBuilder('tag')

    // Handle Aggregation
    if (query.aggregate) {
        applyTranslationAggregation(baseQueryBuilder, tagRepo, {
            language: query.language ?? undefined,
            mainAlias: 'tag',
        })
    }

    applyTaxonomyPublicListFilters(baseQueryBuilder, {
        alias: 'tag',
        aggregate: query.aggregate,
        language: query.language,
        search: query.search,
        translationId: query.translationId,
    })

    const total = await baseQueryBuilder.clone().getCount()

    const publishedStatus = 'published'
    const postCountQuery = buildTagPostCountSubquery(publishedStatus)
    const queryBuilder = baseQueryBuilder.clone()
        .leftJoin(`(${postCountQuery.getQuery()})`, 'post_count_summary', 'post_count_summary.taxonomy_id = COALESCE(tag.translationId, tag.id)')
        .addSelect('COALESCE(post_count_summary.post_count, 0)', 'tag_post_count')
        .setParameters(postCountQuery.getParameters())

    applyTaxonomyPublicListOrdering(queryBuilder, {
        alias: 'tag',
        orderBy: query.orderBy,
        order: query.order,
        postCountAlias: 'tag_post_count',
    })

    const { entities, raw } = await applyPagination(queryBuilder, query).getRawAndEntities()
    const items = entities.map((item, index) => Object.assign(item, {
        postCount: Number(raw[index]?.tag_post_count || 0),
    }))

    // Attach translation information
    await attachTranslations<Tag>(items, tagRepo, {
        select: { id: true, language: true, translationId: true, name: true, slug: true },
    })

    return {
        items,
        total,
        page: query.page,
        limit: query.limit,
    }
}
