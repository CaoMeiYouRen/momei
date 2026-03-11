import { type SelectQueryBuilder } from 'typeorm'
import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { Post } from '@/server/entities/post'
import { tagQuerySchema } from '@/utils/schemas/tag'
import { applyPagination } from '@/server/utils/pagination'
import { success, paginate } from '@/server/utils/response'
import { applyTranslationAggregation, attachTranslations } from '@/server/utils/translation'

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => tagQuerySchema.parse(q))

    const tagRepo = dataSource.getRepository(Tag)
    const postCountSelect = 'COUNT(DISTINCT COALESCE(p.translationId, p.id))'

    const queryBuilder = tagRepo.createQueryBuilder('tag')
        .addSelect((subQuery) => subQuery
            .select(postCountSelect, 'postCount')
            .from(Post, 'p')
            .innerJoin('p.tags', 'pt')
            .where('COALESCE(pt.translationId, pt.id) = COALESCE(tag.translationId, tag.id)')
            .andWhere('p.status = :publishedStatus', { publishedStatus: 'published' }), 'tag_postCount')

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
        // Use subquery for sorting by relation count
        queryBuilder.addSelect((subQuery: SelectQueryBuilder<any>) => subQuery
            .select(postCountSelect, 'pcount')
            .from(Post, 'p')
            .innerJoin('p.tags', 'pt')
            .where('COALESCE(pt.translationId, pt.id) = COALESCE(tag.translationId, tag.id)')
            .andWhere('p.status = :publishedStatus', { publishedStatus: 'published' }), 'pcount')
        queryBuilder.orderBy('pcount', query.order || 'DESC')
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
