import { In } from 'typeorm'
import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { Post } from '@/server/entities/post'
import { categoryQuerySchema } from '@/utils/schemas/category'
import { applyPagination } from '@/server/utils/pagination'
import { success, paginate } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => categoryQuerySchema.parse(q))

    const categoryRepo = dataSource.getRepository(Category)

    const queryBuilder = categoryRepo.createQueryBuilder('category')
        .leftJoinAndSelect('category.parent', 'parent')
        .loadRelationCountAndMap('category.postCount', 'category.posts', 'post', (qb) => {
            qb.where('post.status = :status', { status: 'published' })
            if (query.language) {
                qb.andWhere('post.language = :language', { language: query.language })
            }
            return qb
        })

    // Handle Aggregation
    if (query.aggregate) {
        const subQuery = categoryRepo.createQueryBuilder('c2')
            .select('MIN(c2.id)')
            .groupBy('COALESCE(c2.translationId, CAST(c2.id AS VARCHAR))')

        queryBuilder.andWhere(`category.id IN (${subQuery.getQuery()})`)
        queryBuilder.setParameters(subQuery.getParameters())
    }

    if (query.search) {
        queryBuilder.where('category.name LIKE :search', { search: `%${query.search}%` })
    }

    if (query.parentId) {
        queryBuilder.andWhere('category.parentId = :parentId', { parentId: query.parentId })
    }

    if (query.language) {
        queryBuilder.andWhere('category.language = :language', { language: query.language })
    }

    if (query.orderBy === 'postCount') {
        // Use subquery for sorting by relation count
        queryBuilder.addSelect((subQuery) => {
            const qb = subQuery
                .select('count(p.id)', 'pcount')
                .from(Post, 'p')
                .where('p.categoryId = category.id')
                .andWhere('p.status = :publishedStatus', { publishedStatus: 'published' })

            if (query.language) {
                qb.andWhere('p.language = :language', { language: query.language })
            } else {
                qb.andWhere('p.language = category.language')
            }
            return qb
        }, 'pcount')
        queryBuilder.orderBy('pcount', query.order || 'DESC')
    } else {
        queryBuilder.orderBy(`category.${query.orderBy || 'createdAt'}`, query.order || 'DESC')
    }

    const [items, total] = await applyPagination(queryBuilder, query).getManyAndCount()

    // Attach translation information
    if (items.length > 0) {
        const translationIds = items
            .map((c) => c.translationId)
            .filter((id) => id !== null) as string[]

        const allTranslations = translationIds.length > 0
            ? await categoryRepo.find({
                where: { translationId: In(translationIds) },
                select: ['id', 'language', 'translationId', 'name'],
            })
            : []

        items.forEach((cat) => {
            if (cat.translationId) {
                (cat as any).translations = allTranslations
                    .filter((t) => t.translationId === cat.translationId)
                    .map((t) => ({
                        id: t.id,
                        language: t.language,
                        name: t.name,
                    }))
            } else {
                (cat as any).translations = [{
                    id: cat.id,
                    language: cat.language,
                    name: cat.name,
                }]
            }
        })
    }

    return success(paginate(items, total, query.page, query.limit))
})
