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

    const queryBuilder = tagRepo.createQueryBuilder('tag')
        .loadRelationCountAndMap('tag.postCount', 'tag.posts', 'post', (qb: SelectQueryBuilder<Post>) => {
            qb.where('post.status = :status', { status: 'published' })
            if (query.language) {
                qb.andWhere('post.language = :language', { language: query.language })
            }
            return qb
        })

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

    if (query.language && !query.aggregate) {
        queryBuilder.andWhere('tag.language = :language', { language: query.language })
    }

    if (query.orderBy === 'postCount') {
        // Use subquery for sorting by relation count
        queryBuilder.addSelect((subQuery: SelectQueryBuilder<any>) => {
            const qb = subQuery
                .select('count(p.id)', 'pcount')
                .from(Post, 'p')
                .innerJoin('p.tags', 'pt')
                .where('pt.id = tag.id')
                .andWhere('p.status = :publishedStatus', { publishedStatus: 'published' })

            if (query.language) {
                qb.andWhere('p.language = :language', { language: query.language })
            } else {
                qb.andWhere('p.language = tag.language')
            }
            return qb
        }, 'pcount')
        queryBuilder.orderBy('pcount', query.order || 'DESC')
    } else {
        queryBuilder.orderBy(`tag.${query.orderBy || 'createdAt'}`, query.order || 'DESC')
    }

    const [items, total] = await applyPagination(queryBuilder, query).getManyAndCount()

    // Attach translation information
    await attachTranslations(items as any, tagRepo, {
        select: ['id', 'language', 'translationId', 'name', 'slug'],
    })

    return success(paginate(items, total, query.page, query.limit))
})
