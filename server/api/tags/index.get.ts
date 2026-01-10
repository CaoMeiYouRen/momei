import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { tagQuerySchema } from '@/utils/schemas/tag'

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => tagQuerySchema.parse(q))

    const tagRepo = dataSource.getRepository(Tag)

    const queryBuilder = tagRepo.createQueryBuilder('tag')

    if (query.search) {
        queryBuilder.where('tag.name LIKE :search', { search: `%${query.search}%` })
    }

    if (query.language) {
        queryBuilder.andWhere('tag.language = :language', { language: query.language })
    }

    queryBuilder.orderBy('tag.createdAt', 'DESC')

    const [items, total] = await applyPagination(queryBuilder, query).getManyAndCount()

    return success(paginate(items, total, query.page, query.limit))
})
