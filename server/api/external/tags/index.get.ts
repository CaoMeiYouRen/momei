import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { tagQuerySchema } from '@/utils/schemas/tag'
import { applyPagination } from '@/server/utils/pagination'
import { paginate } from '@/server/utils/response'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { applyTranslationAggregation, attachTranslations } from '@/server/utils/translation'
import { buildTagPostCountSubquery } from '@/server/utils/taxonomy-post-count'
import {
    applyTaxonomyPublicListFilters,
    applyTaxonomyPublicListOrdering,
} from '@/server/utils/taxonomy-public-list'

export default defineEventHandler(async (event) => {
    // Authenticate API key — user is not needed for read-only public data access
    const { user } = await validateApiKeyRequest(event)
    void user

    const query = await getValidatedQuery(event, (q) => tagQuerySchema.parse(q))

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
    await attachTranslations<Tag>(items, tagRepo, {
        select: { id: true, language: true, translationId: true, name: true, slug: true },
    })

    return {
        code: 200,
        data: paginate(items, total, query.page, query.limit),
    }
})
