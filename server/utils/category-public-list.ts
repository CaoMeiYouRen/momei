/**
 * 分类公开列表查询共享层
 *
 * 消除 `/api/categories` (内部) 与 `/api/external/categories` (外部)
 * 之间的列表查询逻辑重复。
 *
 * ## 职责
 * - 完整的分类公开列表查询（含父分类 join、聚合、过滤、Post Count、排序、分页、翻译附着）
 * - 不关心缓存、认证等外层包装，由调用方（内部/外部 handler）各自处理
 *
 * @see `server/api/categories/index.get.ts`
 * @see `server/api/external/categories/index.get.ts`
 */
import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { applyPagination } from '@/server/utils/pagination'
import { applyTranslationAggregation, attachTranslations } from '@/server/utils/translation'
import { buildCategoryPostCountSubquery } from '@/server/utils/taxonomy-post-count'
import {
    applyTaxonomyPublicListFilters,
    applyTaxonomyPublicListOrdering,
} from '@/server/utils/taxonomy-public-list'

export interface CategoryPublicListQuery {
    aggregate?: boolean
    language?: null | string
    limit: number
    order?: null | string
    orderBy?: null | string
    page: number
    parentId?: null | string
    search?: null | string
    translationId?: null | string
}

export interface CategoryPublicListResult {
    items: (Category & { postCount: number })[]
    total: number
    page: number
    limit: number
}

export async function queryCategoryPublicList(query: CategoryPublicListQuery): Promise<CategoryPublicListResult> {
    const categoryRepo = dataSource.getRepository(Category)
    const baseQueryBuilder = categoryRepo.createQueryBuilder('category')
        .leftJoin('category.parent', 'parent')
        .addSelect(['parent.id', 'parent.name', 'parent.slug'])

    // Handle Aggregation
    if (query.aggregate) {
        applyTranslationAggregation(baseQueryBuilder, categoryRepo, {
            language: query.language ?? undefined,
            mainAlias: 'category',
        })
    }

    applyTaxonomyPublicListFilters(baseQueryBuilder, {
        alias: 'category',
        aggregate: query.aggregate,
        language: query.language,
        search: query.search,
        translationId: query.translationId,
    })

    if (query.parentId) {
        baseQueryBuilder.andWhere('category.parentId = :parentId', { parentId: query.parentId })
    }

    const total = await baseQueryBuilder.clone().getCount()

    const publishedStatus = 'published'
    const postCountQuery = buildCategoryPostCountSubquery(publishedStatus)
    const queryBuilder = baseQueryBuilder.clone()
        .leftJoin(`(${postCountQuery.getQuery()})`, 'post_count_summary', 'post_count_summary.taxonomy_id = COALESCE(category.translationId, category.id)')
        .addSelect('COALESCE(post_count_summary.post_count, 0)', 'category_post_count')
        .setParameters(postCountQuery.getParameters())

    applyTaxonomyPublicListOrdering(queryBuilder, {
        alias: 'category',
        orderBy: query.orderBy,
        order: query.order,
        postCountAlias: 'category_post_count',
    })

    const { entities, raw } = await applyPagination(queryBuilder, query).getRawAndEntities()
    const items = entities.map((item, index) => Object.assign(item, {
        postCount: Number(raw[index]?.category_post_count || 0),
    }))

    // Attach translation information
    await attachTranslations<Category>(items, categoryRepo, {
        select: { id: true, language: true, translationId: true, name: true, slug: true, description: true, parentId: true },
    })

    return {
        items,
        total,
        page: query.page,
        limit: query.limit,
    }
}
