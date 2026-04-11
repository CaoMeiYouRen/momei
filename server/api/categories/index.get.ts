import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { categoryQuerySchema } from '@/utils/schemas/category'
import { applyPagination } from '@/server/utils/pagination'
import { success, paginate } from '@/server/utils/response'
import { applyTranslationAggregation, attachTranslations } from '@/server/utils/translation'
import { buildCategoryPostCountSubquery } from '@/server/utils/taxonomy-post-count'

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => categoryQuerySchema.parse(q))

    const categoryRepo = dataSource.getRepository(Category)
    const publishedStatus = 'published'
    const postCountQuery = buildCategoryPostCountSubquery(publishedStatus)

    const queryBuilder = categoryRepo.createQueryBuilder('category')
        .leftJoin('category.parent', 'parent')
        .addSelect(['parent.id', 'parent.name', 'parent.slug'])
        .leftJoin(`(${postCountQuery.getQuery()})`, 'postCountSummary', 'postCountSummary.taxonomyId = COALESCE(category.translationId, category.id)')
        .addSelect('COALESCE(postCountSummary.postCount, 0)', 'category_postCount')
        .setParameters(postCountQuery.getParameters())

    // Handle Aggregation
    if (query.aggregate) {
        applyTranslationAggregation(queryBuilder, categoryRepo, {
            language: query.language,
            mainAlias: 'category',
        })
    }

    if (query.search) {
        queryBuilder.andWhere('category.name LIKE :search', { search: `%${query.search}%` })
    }

    if (query.parentId) {
        queryBuilder.andWhere('category.parentId = :parentId', { parentId: query.parentId })
    }

    if (query.translationId) {
        queryBuilder.andWhere('COALESCE(category.translationId, category.slug) = :translationId', {
            translationId: query.translationId,
        })
    }

    if (query.language && !query.aggregate) {
        queryBuilder.andWhere('category.language = :language', { language: query.language })
    }

    if (query.orderBy === 'postCount') {
        queryBuilder.orderBy('category_postCount', query.order || 'DESC')
    } else {
        queryBuilder.orderBy(`category.${query.orderBy || 'createdAt'}`, query.order || 'DESC')
    }

    const total = await queryBuilder.clone().getCount()
    const { entities, raw } = await applyPagination(queryBuilder, query).getRawAndEntities()
    const items = entities.map((item, index) => Object.assign(item, {
        postCount: Number(raw[index]?.category_postCount || 0),
    }))

    // Attach translation information
    await attachTranslations(items as any, categoryRepo, {
        select: ['id', 'language', 'translationId', 'name', 'slug', 'description', 'parentId'],
    })

    return success(paginate(items, total, query.page, query.limit))
})
