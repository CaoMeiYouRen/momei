import { dataSource, ensureDatabaseReady } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { tagQuerySchema } from '@/utils/schemas/tag'
import { applyPagination } from '@/server/utils/pagination'
import { success, paginate } from '@/server/utils/response'
import { applyTranslationAggregation, attachTranslations } from '@/server/utils/translation'
import { buildTagPostCountSubquery } from '@/server/utils/taxonomy-post-count'
import { withRuntimeApiCache } from '@/server/utils/api-runtime-cache'
import {
    applyTaxonomyPublicListFilters,
    applyTaxonomyPublicListOrdering,
    buildTaxonomyPublicListCacheKey,
} from '@/server/utils/taxonomy-public-list'

const TAG_PUBLIC_LIST_CACHE_NAMESPACE = 'tags:public-list'
const TAG_PUBLIC_LIST_CACHE_TTL_SECONDS = 60

function buildTagPublicListCacheKey(query: {
    aggregate?: boolean
    language?: null | string
    limit: number
    order?: null | string
    orderBy?: null | string
    page: number
    search?: null | string
    translationId?: null | string
}) {
    return buildTaxonomyPublicListCacheKey({
        namespace: TAG_PUBLIC_LIST_CACHE_NAMESPACE,
        query,
    })
}

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => tagQuerySchema.parse(q))
    const cacheKey = buildTagPublicListCacheKey(query)

    return await withRuntimeApiCache({
        event,
        key: cacheKey,
        namespace: TAG_PUBLIC_LIST_CACHE_NAMESPACE,
        ttlSeconds: TAG_PUBLIC_LIST_CACHE_TTL_SECONDS,
        isSharedPublicResponse: true,
        loader: async () => {
            const databaseReady = await ensureDatabaseReady()
            if (!databaseReady) {
                throw createError({
                    statusCode: 503,
                    statusMessage: 'Database unavailable',
                })
            }

            const tagRepo = dataSource.getRepository(Tag)
            const baseQueryBuilder = tagRepo.createQueryBuilder('tag')

            // Handle Aggregation
            if (query.aggregate) {
                applyTranslationAggregation(baseQueryBuilder, tagRepo, {
                    language: query.language,
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
            await attachTranslations(items as any, tagRepo, {
                select: ['id', 'language', 'translationId', 'name', 'slug'],
            })

            return success(paginate(items, total, query.page, query.limit))
        },
    })
})
