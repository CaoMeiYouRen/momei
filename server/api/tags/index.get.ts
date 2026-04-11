import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { tagQuerySchema } from '@/utils/schemas/tag'
import { applyPagination } from '@/server/utils/pagination'
import { success, paginate } from '@/server/utils/response'
import { applyTranslationAggregation, attachTranslations } from '@/server/utils/translation'
import { buildTagPostCountSubquery } from '@/server/utils/taxonomy-post-count'

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => tagQuerySchema.parse(q))

    const tagRepo = dataSource.getRepository(Tag)
    const publishedStatus = 'published'
    const postCountQuery = buildTagPostCountSubquery(publishedStatus)

    const queryBuilder = tagRepo.createQueryBuilder('tag')
        .leftJoin(`(${postCountQuery.getQuery()})`, 'postCountSummary', 'postCountSummary.taxonomyId = COALESCE(tag.translationId, tag.id)')
        .addSelect('COALESCE(postCountSummary.postCount, 0)', 'tag_postCount')
        .setParameters(postCountQuery.getParameters())

    // Handle Aggregation
    if (query.aggregate) {
        applyTranslationAggregation(queryBuilder, tagRepo, {
            language: query.language,
            mainAlias: 'tag',
        })
    }

    if (query.search) {
        queryBuilder.andWhere('tag.name LIKE :search', { search: `%${query.search}%` })
    }

    if (query.translationId) {
        queryBuilder.andWhere('COALESCE(tag.translationId, tag.slug) = :translationId', {
            translationId: query.translationId,
        })
    }

    if (query.language && !query.aggregate) {
        queryBuilder.andWhere('tag.language = :language', { language: query.language })
    }

    if (query.orderBy === 'postCount') {
        queryBuilder.orderBy('tag_postCount', query.order || 'DESC')
    } else {
        queryBuilder.orderBy(`tag.${query.orderBy || 'createdAt'}`, query.order || 'DESC')
    }

    const total = await queryBuilder.clone().getCount()
    const { entities, raw } = await applyPagination(queryBuilder, query).getRawAndEntities()
    const items = entities.map((item, index) => Object.assign(item, {
        postCount: Number(raw[index]?.tag_postCount || 0),
    }))

    // Attach translation information
    await attachTranslations(items as any, tagRepo, {
        select: ['id', 'language', 'translationId', 'name', 'slug'],
    })

    return success(paginate(items, total, query.page, query.limit))
})
