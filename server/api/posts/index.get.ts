import { Brackets, type WhereExpressionBuilder } from 'typeorm'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { getSetting } from '@/server/services/setting'
import { postQuerySchema } from '@/utils/schemas/post'
import { success, paginate } from '@/server/utils/response'
import { applyDefaultPaginationLimit, applyPagination } from '@/server/utils/pagination'
import { isAdmin } from '@/utils/shared/roles'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { processAuthorsPrivacy } from '@/server/utils/author'
import { applyPostVisibilityFilter, rethrowPostAccessError } from '@/server/utils/post-access'
import { applyTranslationAggregation, attachTranslations } from '@/server/utils/translation'
import { applyPostsReadModelFromMetadata } from '@/server/utils/post-metadata'
import { applyPostOrdering } from '@/server/utils/post-ordering'
import { applyPostListSelect, applyPublishedPostLanguageFallbackFilter } from '@/server/utils/post-list-query'
import { buildRuntimeApiCacheKey, withRuntimeApiCache } from '@/server/utils/api-runtime-cache'
import { SettingKey } from '@/types/setting'

const POSTS_PUBLIC_LIST_CACHE_TTL_SECONDS = 60
const POSTS_PUBLIC_LIST_CACHE_NAMESPACE = 'posts:public-list'

function buildPostsPublicListCacheKey(query: {
    authorId?: null | string
    category?: null | string
    categoryId?: null | string
    excludeIds?: string[]
    isPinned?: boolean
    language?: null | string
    limit: number
    order?: null | string
    orderBy?: null | string
    page: number
    search?: null | string
    scope: 'manage' | 'public'
    tag?: null | string
    tagId?: null | string
    translationId?: null | string
}) {
    return buildRuntimeApiCacheKey(POSTS_PUBLIC_LIST_CACHE_NAMESPACE, JSON.stringify({
        scope: query.scope,
        page: query.page,
        limit: query.limit,
        language: query.language ?? null,
        authorId: query.authorId ?? null,
        categoryId: query.categoryId ?? null,
        category: query.category ?? null,
        translationId: query.translationId ?? null,
        isPinned: query.isPinned ?? null,
        excludeIds: query.excludeIds ?? [],
        tagId: query.tagId ?? null,
        tag: query.tag ?? null,
        search: query.search ?? null,
        orderBy: query.orderBy ?? null,
        order: query.order ?? null,
    }))
}

export default defineEventHandler(async (event) => {
    const postsPerPage = await getSetting(SettingKey.POSTS_PER_PAGE, '10')
    const query = await getValidatedQuery(event, (q) => postQuerySchema.parse(applyDefaultPaginationLimit(q as Record<string, unknown>, postsPerPage)))
    const user = event.context?.user
    const isSharedPublicResponse = query.scope === 'public' && !event.context?.auth?.user && !user
    const publicCacheKey = buildPostsPublicListCacheKey(query)

    // 如果是管理模式，强制校验权限
    if (query.scope === 'manage') {
        await requireAdminOrAuthor(event)
    }

    return await withRuntimeApiCache({
        event,
        key: publicCacheKey,
        namespace: POSTS_PUBLIC_LIST_CACHE_NAMESPACE,
        ttlSeconds: POSTS_PUBLIC_LIST_CACHE_TTL_SECONDS,
        isSharedPublicResponse,
        loader: async () => {
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
            const qb = applyPostListSelect(postRepo.createQueryBuilder('post'))

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
                try {
                    await applyPostVisibilityFilter(qb, user, 'public')
                } catch (error) {
                    rethrowPostAccessError(error)
                }

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

            if (query.scope !== 'manage') {
                applyPublishedPostLanguageFallbackFilter(qb, query.language)
            }

            if (query.translationId) {
                qb.andWhere('post.translationId = :translationId', { translationId: query.translationId })
            }

            if (query.isPinned !== undefined) {
                qb.andWhere('post.isPinned = :isPinned', { isPinned: query.isPinned })
            }

            if (query.excludeIds && query.excludeIds.length > 0) {
                qb.andWhere('post.id NOT IN (:...excludeIds)', { excludeIds: query.excludeIds })
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
            applyPostOrdering(qb, {
                alias: 'post',
                orderBy: query.orderBy,
                order: query.order,
                prioritizePinned: true,
            })

            // Pagination
            applyPagination(qb, query)

            const [items, total] = await qb.getManyAndCount()

            // Attach translation information for management mode
            if (query.scope === 'manage') {
                await attachTranslations(items as any, postRepo, {
                    select: ['id', 'language', 'status', 'translationId', 'title', 'coverImage', 'metadata'],
                })
            }

            applyPostsReadModelFromMetadata(items)

            // 处理作者哈希并保护隐私
            const isUserAdmin = user && isAdmin(user.role)
            await processAuthorsPrivacy(items, !!isUserAdmin)

            return success(paginate(items, total, query.page, query.limit))
        },
    })
})
