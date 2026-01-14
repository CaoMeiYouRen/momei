import { In } from 'typeorm'
import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { Post } from '@/server/entities/post'
import { tagQuerySchema } from '@/utils/schemas/tag'
import { applyPagination } from '@/server/utils/pagination'
import { success, paginate } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => tagQuerySchema.parse(q))

    const tagRepo = dataSource.getRepository(Tag)

    const queryBuilder = tagRepo.createQueryBuilder('tag')
        .loadRelationCountAndMap('tag.postCount', 'tag.posts', 'post', (qb) => {
            qb.where('post.status = :status', { status: 'published' })
            if (query.language) {
                qb.andWhere('post.language = :language', { language: query.language })
            }
            return qb
        })

    // Handle Aggregation
    if (query.aggregate) {
        const subQuery = tagRepo.createQueryBuilder('t2')
            .select('MIN(t2.id)')
            .groupBy('COALESCE(t2.translationId, CAST(t2.id AS VARCHAR))')

        queryBuilder.andWhere(`tag.id IN (${subQuery.getQuery()})`)
        queryBuilder.setParameters(subQuery.getParameters())
    }

    if (query.search) {
        queryBuilder.where('tag.name LIKE :search', { search: `%${query.search}%` })
    }

    if (query.language) {
        queryBuilder.andWhere('tag.language = :language', { language: query.language })
    }

    if (query.orderBy === 'postCount') {
        // Use subquery for sorting by relation count
        queryBuilder.addSelect((subQuery) => {
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
    if (items.length > 0) {
        const translationIds = items
            .map((t) => t.translationId)
            .filter((id) => id !== null) as string[]

        const allTranslations = translationIds.length > 0
            ? await tagRepo.find({
                where: { translationId: In(translationIds) },
                select: ['id', 'language', 'translationId', 'name'],
            })
            : []

        items.forEach((tag) => {
            if (tag.translationId) {
                (tag as any).translations = allTranslations
                    .filter((t) => t.translationId === tag.translationId)
                    .map((t) => ({
                        id: t.id,
                        language: t.language,
                        name: t.name,
                    }))
            } else {
                (tag as any).translations = [{
                    id: tag.id,
                    language: tag.language,
                    name: tag.name,
                }]
            }
        })
    }

    return success(paginate(items, total, query.page, query.limit))
})
