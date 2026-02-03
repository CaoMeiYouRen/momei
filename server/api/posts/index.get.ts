import { Brackets, type WhereExpressionBuilder, type SelectQueryBuilder } from 'typeorm'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { postQuerySchema } from '@/utils/schemas/post'
import { success, paginate } from '@/server/utils/response'
import { applyPagination } from '@/server/utils/pagination'
import { isAdmin } from '@/utils/shared/roles'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { processAuthorsPrivacy } from '@/server/utils/author'
import { applyPostVisibilityFilter } from '@/server/utils/post-access'
import { applyTranslationAggregation, attachTranslations } from '@/server/utils/translation'

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => postQuerySchema.parse(q))
    const user = event.context?.user

    // 如果是管理模式，强制校验权限
    if (query.scope === 'manage') {
        await requireAdminOrAuthor(event)
    }

    // 如果数据库未初始化，返回空列表
    if (!dataSource.isInitialized) {
        return success({
            items: [],
            total: 0,
            page: query.page,
            limit: query.limit,
            totalPages: 0,
        })
    }

    const postRepo = dataSource.getRepository(Post)
    const qb = postRepo.createQueryBuilder('post')
        .leftJoin('post.author', 'author')
        .addSelect(['author.id', 'author.name', 'author.image', 'author.email'])
        .leftJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.tags', 'tags')

    // Handle Aggregation for Management Mode
    if (query.aggregate && query.scope === 'manage') {
        applyTranslationAggregation(qb, postRepo, {
            language: query.language,
            mainAlias: 'post',
            applyFilters: (subQuery) => {
                // Apply same primary filters to subquery to ensure consistency
                if (!isAdmin(user!.role)) {
                    subQuery.andWhere('p2.authorId = :currentUserId', { currentUserId: user!.id })
                } else if (query.authorId) {
                    subQuery.andWhere('p2.authorId = :authorId', { authorId: query.authorId })
                }
            },
        })
    }

    if (query.scope === 'manage') {
        // Management Mode
        if (isAdmin(user!.role)) {
            // Admins can filter by authorId or see all
            if (query.authorId) {
                qb.andWhere('post.authorId = :authorId', { authorId: query.authorId })
            }
        } else {
            // Authors only see their own posts
            qb.andWhere('post.authorId = :currentUserId', { currentUserId: user!.id })
        }

        // Status filtering
        if (query.status) {
            qb.andWhere('post.status = :status', { status: query.status })
        }

        // If aggregating, we don't want strict language filtering at the top level
        // because the aggregation logic already handles picking the preferred language.
        if (query.language && !query.aggregate) {
            qb.andWhere('post.language = :language', { language: query.language })
        }
    } else {
        // Public Mode: 应用统一的可见性过滤逻辑
        await applyPostVisibilityFilter(qb, user, 'public')

        if (query.authorId) {
            qb.andWhere('post.authorId = :authorId', { authorId: query.authorId })
        }
    }

    // Common filters
    if (query.categoryId) {
        qb.andWhere('post.categoryId = :categoryId', { categoryId: query.categoryId })
    } else if (query.category) {
        qb.andWhere(new Brackets((sub: WhereExpressionBuilder) => {
            sub.where('category.slug = :cat', { cat: query.category })
                .orWhere('category.id = :cat', { cat: query.category })
        }))
        if (query.language) {
            qb.andWhere('category.language = :language', { language: query.language })
        }
    }

    if (query.language && query.scope !== 'manage') {
        // Public Multi-language aggregation logic:
        // 1. Show posts in the target language.
        // 2. Show posts in other languages ONLY IF there is no version in the target language for that cluster.
        // 3. Unique posts (translationId is null) are always shown.
        qb.andWhere(new Brackets((sub: WhereExpressionBuilder) => {
            sub.where('post.language = :language', { language: query.language })
                .orWhere(new Brackets((ss: WhereExpressionBuilder) => {
                    ss.where('post.translationId IS NOT NULL')
                        .andWhere('post.language != :language', { language: query.language })
                        .andWhere((subQb: SelectQueryBuilder<any>) => {
                            const existsQuery = subQb.subQuery()
                                .select('1')
                                .from(Post, 'p2')
                                .where('p2.translationId = post.translationId')
                                .andWhere('p2.language = :language', { language: query.language })
                                .andWhere('p2.status = :status', { status: 'published' })
                                .getQuery()
                            return `NOT EXISTS ${existsQuery}`
                        })
                }))
                .orWhere('post.translationId IS NULL')
        }))
    }

    if (query.translationId) {
        qb.andWhere('post.translationId = :translationId', { translationId: query.translationId })
    }

    if (query.tagId) {
        qb.innerJoin('post.tags', 'tag', 'tag.id = :tagId', { tagId: query.tagId })
    } else if (query.tag) {
        qb.innerJoin('post.tags', 'tagBySlug', 'tagBySlug.slug = :tagSlug', { tagSlug: query.tag })
        if (query.language) {
            qb.andWhere('tagBySlug.language = :language', { language: query.language })
        }
    }

    if (query.search) {
        qb.andWhere(new Brackets((subQb: WhereExpressionBuilder) => {
            subQb.where('post.title LIKE :search', { search: `%${query.search}%` })
                .orWhere('post.summary LIKE :search', { search: `%${query.search}%` })
        }))
    }

    // Sorting
    qb.orderBy(`post.${query.orderBy}`, query.order)

    // Pagination
    applyPagination(qb, query)

    const [items, total] = await qb.getManyAndCount()

    // 处理作者哈希并保护隐私
    const isUserAdmin = user && isAdmin(user.role)
    await processAuthorsPrivacy(items, !!isUserAdmin)

    // Attach translation information for management mode
    if (query.scope === 'manage') {
        await attachTranslations(items as any, postRepo, {
            select: ['id', 'language', 'status', 'translationId', 'title'],
        })
    }

    return success(paginate(items, total, query.page, query.limit))
})
