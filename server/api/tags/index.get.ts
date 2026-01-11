import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { tagQuerySchema } from '@/utils/schemas/tag'

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => tagQuerySchema.parse(q))

    const tagRepo = dataSource.getRepository(Tag)

    const queryBuilder = tagRepo.createQueryBuilder('tag')
        .loadRelationCountAndMap('tag.postCount', 'tag.posts', 'post', (qb) => qb.where('post.status = :status', { status: 'published' }))

    if (query.search) {
        queryBuilder.where('tag.name LIKE :search', { search: `%${query.search}%` })
    }

    if (query.language) {
        queryBuilder.andWhere('tag.language = :language', { language: query.language })
    }

    if (query.orderBy === 'postCount') {
        // Use subquery for sorting by relation count
        queryBuilder.addSelect((subQuery) => subQuery
            .select('count(p.id)', 'pcount')
            .from('post', 'p')
            .innerJoin('p.tags', 't')
            .where('t.id = tag.id')
            .andWhere('p.status = :status', { status: 'published' }), 'pcount')
        queryBuilder.orderBy('pcount', query.order || 'DESC')
    } else {
        queryBuilder.orderBy(`tag.${query.orderBy || 'createdAt'}`, query.order || 'DESC')
    }

    const [items, total] = await applyPagination(queryBuilder, query).getManyAndCount()

    return success(paginate(items, total, query.page, query.limit))
})
