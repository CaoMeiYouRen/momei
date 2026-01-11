import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { categoryQuerySchema } from '@/utils/schemas/category'

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => categoryQuerySchema.parse(q))

    const categoryRepo = dataSource.getRepository(Category)

    const queryBuilder = categoryRepo.createQueryBuilder('category')
        .leftJoinAndSelect('category.parent', 'parent')
        .loadRelationCountAndMap('category.postCount', 'category.posts', 'post', (qb) => qb.where('post.status = :status', { status: 'published' }))

    if (query.search) {
        queryBuilder.where('category.name LIKE :search', { search: `%${query.search}%` })
    }

    if (query.parentId) {
        queryBuilder.andWhere('category.parentId = :parentId', { parentId: query.parentId })
    }

    if (query.language) {
        queryBuilder.andWhere('category.language = :language', { language: query.language })
    }

    queryBuilder.orderBy('category.createdAt', 'DESC')

    const [items, total] = await applyPagination(queryBuilder, query).getManyAndCount()

    return success(paginate(items, total, query.page, query.limit))
})
