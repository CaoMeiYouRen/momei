import { Brackets, type WhereExpressionBuilder, type SelectQueryBuilder } from 'typeorm'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { getSetting } from '@/server/services/setting'
import { postQuerySchema } from '@/utils/schemas/post'
import { success, paginate } from '@/server/utils/response'
import { applyDefaultPaginationLimit, applyPagination } from '@/server/utils/pagination'
import { isAdmin } from '@/utils/shared/roles'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { processAuthorsPrivacy } from '@/server/utils/author'
import { applyPostVisibilityFilter } from '@/server/utils/post-access'
import { applyTranslationAggregation, attachTranslations } from '@/server/utils/translation'
import { applyPostsReadModelFromMetadata } from '@/server/utils/post-metadata'
import { SettingKey } from '@/types/setting'
import { getLocaleRegistryItem } from '@/i18n/config/locale-registry'

export default defineEventHandler(async (event) => {
    const postsPerPage = await getSetting(SettingKey.POSTS_PER_PAGE, '10')
    const query = await getValidatedQuery(event, (q) => postQuerySchema.parse(applyDefaultPaginationLimit(q as Record<string, unknown>, postsPerPage)))
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
        const fallbackChain = getLocaleRegistryItem(query.language).fallbackChain

        qb.andWhere(new Brackets((sub: WhereExpressionBuilder) => {
            sub.where('post.translationId IS NULL')

            fallbackChain.forEach((fallbackLanguage, index) => {
                const languageParam = index === 0 ? 'language' : `fallbackLanguage${index}`
                const params: Record<string, string | string[]> = {
                    [languageParam]: fallbackLanguage,
                }

                sub.orWhere(new Brackets((candidate: WhereExpressionBuilder) => {
                    candidate.where('post.translationId IS NOT NULL')
                        .andWhere(`post.language = :${languageParam}`, params)

                    const previousLanguages = fallbackChain.slice(0, index)
                    if (previousLanguages.length > 0) {
                        const previousLanguagesParam = `previousLanguages${index}`
                        candidate.andWhere((subQb: SelectQueryBuilder<Post>) => {
                            const existsQuery = subQb.subQuery()
                                .select('1')
                                .from(Post, 'p2')
                                .where('p2.translationId = post.translationId')
                                .andWhere('p2.status = :publishedStatus', { publishedStatus: 'published' })
                                .andWhere(`p2.language IN (:...${previousLanguagesParam})`, {
                                    [previousLanguagesParam]: previousLanguages,
                                })
                                .getQuery()
                            return `NOT EXISTS ${existsQuery}`
                        })
                    }
                }))
            })
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
    applyPostsReadModelFromMetadata(items)

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
