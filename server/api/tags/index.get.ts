import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { Post } from '@/server/entities/post'
import { tagQuerySchema } from '@/utils/schemas/tag'

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

    return success(paginate(items, total, query.page, query.limit))
})
