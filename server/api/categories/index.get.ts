import { type SelectQueryBuilder } from 'typeorm'
import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { Post } from '@/server/entities/post'
import { categoryQuerySchema } from '@/utils/schemas/category'
import { applyPagination } from '@/server/utils/pagination'
import { success, paginate } from '@/server/utils/response'
import { applyTranslationAggregation, attachTranslations } from '@/server/utils/translation'

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => categoryQuerySchema.parse(q))

    const categoryRepo = dataSource.getRepository(Category)
    const postCountSelect = 'COUNT(DISTINCT COALESCE(p.translationId, p.id))'

    const queryBuilder = categoryRepo.createQueryBuilder('category')
        .leftJoinAndSelect('category.parent', 'parent')
        .addSelect((subQuery) => {
            return subQuery
                .select(postCountSelect, 'postCount')
                .from(Post, 'p')
                .innerJoin(Category, 'postCategory', 'postCategory.id = p.categoryId')
                .where('COALESCE(postCategory.translationId, postCategory.id) = COALESCE(category.translationId, category.id)')
                .andWhere('p.status = :publishedStatus', { publishedStatus: 'published' })
        }, 'category_postCount')

    // Handle Aggregation
    if (query.aggregate) {
        applyTranslationAggregation(queryBuilder, categoryRepo, {
            language: query.language,
            mainAlias: 'category',
        })
    }

    if (query.search) {
        queryBuilder.andWhere('category.name LIKE :search', { search: `%${query.search}%` })
    }

    if (query.parentId) {
        queryBuilder.andWhere('category.parentId = :parentId', { parentId: query.parentId })
    }

    if (query.language && !query.aggregate) {
        queryBuilder.andWhere('category.language = :language', { language: query.language })
    }

    if (query.orderBy === 'postCount') {
        // Use subquery for sorting by relation count
        queryBuilder.addSelect((subQuery: SelectQueryBuilder<any>) => {
            return subQuery
                .select(postCountSelect, 'pcount')
                .from(Post, 'p')
                .innerJoin(Category, 'postCategory', 'postCategory.id = p.categoryId')
                .where('COALESCE(postCategory.translationId, postCategory.id) = COALESCE(category.translationId, category.id)')
                .andWhere('p.status = :publishedStatus', { publishedStatus: 'published' })
        }, 'pcount')
        queryBuilder.orderBy('pcount', query.order || 'DESC')
    } else {
        queryBuilder.orderBy(`category.${query.orderBy || 'createdAt'}`, query.order || 'DESC')
    }

    const total = await queryBuilder.clone().getCount()
    const { entities, raw } = await applyPagination(queryBuilder, query).getRawAndEntities()
    const items = entities.map((item, index) => Object.assign(item, {
        postCount: Number(raw[index]?.category_postCount || 0),
    }))

    // Attach translation information
    await attachTranslations(items as any, categoryRepo, {
        select: ['id', 'language', 'translationId', 'name', 'slug', 'description', 'parentId'],
    })

    return success(paginate(items, total, query.page, query.limit))
})
