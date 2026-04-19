import { dataSource, ensureDatabaseReady } from '@/server/database'
import { Category } from '@/server/entities/category'
import { categoryQuerySchema } from '@/utils/schemas/category'
import { applyPagination } from '@/server/utils/pagination'
import { success, paginate } from '@/server/utils/response'
import { applyTranslationAggregation, attachTranslations } from '@/server/utils/translation'
import { buildCategoryPostCountSubquery } from '@/server/utils/taxonomy-post-count'
import { buildRuntimeApiCacheKey, withRuntimeApiCache } from '@/server/utils/api-runtime-cache'

const CATEGORY_PUBLIC_LIST_CACHE_NAMESPACE = 'categories:public-list'
const CATEGORY_PUBLIC_LIST_CACHE_TTL_SECONDS = 60

function buildCategoryPublicListCacheKey(query: {
    aggregate?: boolean
    language?: null | string
    limit: number
    order?: null | string
    orderBy?: null | string
    page: number
    parentId?: null | string
    search?: null | string
    translationId?: null | string
}) {
    return buildRuntimeApiCacheKey(
        CATEGORY_PUBLIC_LIST_CACHE_NAMESPACE,
        query.aggregate ? '1' : '0',
        query.language ?? 'all',
        query.parentId ?? 'all',
        query.translationId ?? 'all',
        query.search ?? '',
        query.orderBy ?? 'createdAt',
        query.order ?? 'DESC',
        query.page,
        query.limit,
    )
}

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => categoryQuerySchema.parse(q))
    const cacheKey = buildCategoryPublicListCacheKey(query)

    return await withRuntimeApiCache({
        event,
        key: cacheKey,
        namespace: CATEGORY_PUBLIC_LIST_CACHE_NAMESPACE,
        ttlSeconds: CATEGORY_PUBLIC_LIST_CACHE_TTL_SECONDS,
        isSharedPublicResponse: true,
        loader: async () => {
            const databaseReady = await ensureDatabaseReady()
            if (!databaseReady) {
                throw createError({
                    statusCode: 503,
                    statusMessage: 'Database unavailable',
                })
            }

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

            if (query.search) {
                baseQueryBuilder.andWhere('category.name LIKE :search', { search: `%${query.search}%` })
            }

            if (query.parentId) {
                baseQueryBuilder.andWhere('category.parentId = :parentId', { parentId: query.parentId })
            }

            if (query.translationId) {
                baseQueryBuilder.andWhere('COALESCE(category.translationId, category.slug) = :translationId', {
                    translationId: query.translationId,
                })
            }

            if (query.language && !query.aggregate) {
                baseQueryBuilder.andWhere('category.language = :language', { language: query.language })
            }

            const total = await baseQueryBuilder.clone().getCount()

            const publishedStatus = 'published'
            const postCountQuery = buildCategoryPostCountSubquery(publishedStatus)
            const queryBuilder = baseQueryBuilder.clone()
                .leftJoin(`(${postCountQuery.getQuery()})`, 'post_count_summary', 'post_count_summary.taxonomy_id = COALESCE(category.translationId, category.id)')
                .addSelect('COALESCE(post_count_summary.post_count, 0)', 'category_post_count')
                .setParameters(postCountQuery.getParameters())

            if (query.orderBy === 'postCount') {
                queryBuilder.orderBy('category_post_count', query.order || 'DESC')
            } else {
                queryBuilder.orderBy(`category.${query.orderBy || 'createdAt'}`, query.order || 'DESC')
            }

            const { entities, raw } = await applyPagination(queryBuilder, query).getRawAndEntities()
            const items = entities.map((item, index) => Object.assign(item, {
                postCount: Number(raw[index]?.category_post_count || 0),
            }))

            // Attach translation information
            await attachTranslations(items as any, categoryRepo, {
                select: ['id', 'language', 'translationId', 'name', 'slug', 'description', 'parentId'],
            })

            return success(paginate(items, total, query.page, query.limit))
        },
    })
})
