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
    const baseQueryBuilder = tagRepo.createQueryBuilder('tag')

    // Handle Aggregation
    if (query.aggregate) {
        applyTranslationAggregation(baseQueryBuilder, tagRepo, {
            language: query.language,
            mainAlias: 'tag',
        })
    }

    if (query.search) {
        baseQueryBuilder.andWhere('tag.name LIKE :search', { search: `%${query.search}%` })
    }

    if (query.translationId) {
        baseQueryBuilder.andWhere('COALESCE(tag.translationId, tag.slug) = :translationId', {
            translationId: query.translationId,
        })
    }

    if (query.language && !query.aggregate) {
        baseQueryBuilder.andWhere('tag.language = :language', { language: query.language })
    }

    const total = await baseQueryBuilder.clone().getCount()

    const publishedStatus = 'published'
    const postCountQuery = buildTagPostCountSubquery(publishedStatus)
    const queryBuilder = baseQueryBuilder.clone()
        .leftJoin(`(${postCountQuery.getQuery()})`, 'post_count_summary', 'post_count_summary.taxonomy_id = COALESCE(tag.translationId, tag.id)')
        .addSelect('COALESCE(post_count_summary.post_count, 0)', 'tag_postCount')
        .setParameters(postCountQuery.getParameters())

    if (query.orderBy === 'postCount') {
        queryBuilder.orderBy('tag_postCount', query.order || 'DESC')
    } else {
        queryBuilder.orderBy(`tag.${query.orderBy || 'createdAt'}`, query.order || 'DESC')
    }

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
