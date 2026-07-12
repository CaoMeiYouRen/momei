import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { categoryQuerySchema } from '@/utils/schemas/category'
import { applyPagination } from '@/server/utils/pagination'
import { paginate } from '@/server/utils/response'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { applyTranslationAggregation, attachTranslations } from '@/server/utils/translation'
import { buildCategoryPostCountSubquery } from '@/server/utils/taxonomy-post-count'
import {
    applyTaxonomyPublicListFilters,
    applyTaxonomyPublicListOrdering,
} from '@/server/utils/taxonomy-public-list'

export default defineEventHandler(async (event) => {
    // Authenticate API key — user is not needed for read-only public data access
    const { user } = await validateApiKeyRequest(event)
    void user

    const query = await getValidatedQuery(event, (q) => categoryQuerySchema.parse(q))

    const categoryRepo = dataSource.getRepository(Category)
    const baseQueryBuilder = categoryRepo.createQueryBuilder('category')
        .leftJoin('category.parent', 'parent')
        .addSelect(['parent.id', 'parent.name', 'parent.slug'])

    // Handle Aggregation
    if (query.aggregate) {
        applyTranslationAggregation(baseQueryBuilder, categoryRepo, {
            language: query.language,
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
        code: 200,
        data: paginate(items, total, query.page, query.limit),
    }
})
