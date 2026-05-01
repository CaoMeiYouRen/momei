import { Brackets, type SelectQueryBuilder, type WhereExpressionBuilder } from 'typeorm'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { searchQuerySchema, type SearchQuery } from '@/utils/schemas/search'
import { success, paginate } from '@/server/utils/response'
import { applyPagination } from '@/server/utils/pagination'
import { processAuthorsPrivacy } from '@/server/utils/author'
import { isAdmin } from '@/utils/shared/roles'
import { applyPostVisibilityFilter, rethrowPostAccessError } from '@/server/utils/post-access'
import { applyPostListSelect } from '@/server/utils/post-list-query'
import { buildRuntimeApiCacheKey, withRuntimeApiCache } from '@/server/utils/api-runtime-cache'

const SEARCH_PUBLIC_CACHE_TTL_SECONDS = 60
const SEARCH_PUBLIC_CACHE_NAMESPACE = 'search:public-results'

function buildSearchPublicCacheKey(query: SearchQuery) {
    return buildRuntimeApiCacheKey(SEARCH_PUBLIC_CACHE_NAMESPACE, JSON.stringify({
        q: query.q ?? null,
        language: query.language ?? null,
        category: query.category ?? null,
        tags: query.tags ? [...query.tags].sort() : [],
        sortBy: query.sortBy,
        page: query.page,
        limit: query.limit,
    }))
}

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => searchQuerySchema.parse(q))
    const user = event.context?.user
    const isSharedPublicResponse = !event.context?.auth?.user && !user
    const publicCacheKey = buildSearchPublicCacheKey(query)

    return await withRuntimeApiCache({
        event,
        key: publicCacheKey,
        namespace: SEARCH_PUBLIC_CACHE_NAMESPACE,
        ttlSeconds: SEARCH_PUBLIC_CACHE_TTL_SECONDS,
        isSharedPublicResponse,
        loader: async () => {
            const postRepo = dataSource.getRepository(Post)
            const qb = applyPostListSelect(postRepo.createQueryBuilder('post'))

            // 应用统一的文章可见性过滤逻辑
            try {
                await applyPostVisibilityFilter(qb, user, 'public')
            } catch (error) {
                rethrowPostAccessError(error)
            }

            // 1. Keyword search (Title, Summary, long-keyword Content fallback)
            // Keep the documented semantics: content matching is only enabled for longer keywords.
            if (query.q) {
                const q = query.q.trim()
                qb.andWhere(new Brackets((sub: WhereExpressionBuilder) => {
                    sub.where('post.title LIKE :q', { q: `%${q}%` })
                        .orWhere('post.summary LIKE :q', { q: `%${q}%` })
                    if (q.length > 3) {
                        sub.orWhere('post.content LIKE :q', { q: `%${q}%` })
                    }
                }))
            }

            // 2. Category Filter
            if (query.category) {
                qb.andWhere(new Brackets((sub: WhereExpressionBuilder) => {
                    sub.where('category.slug = :cat', { cat: query.category })
                        .orWhere('category.id = :cat', { cat: query.category })
                }))
            }

            // 3. Tags Filter
            if (query.tags && query.tags.length > 0) {
                // Tag filter: Post must have ALL listed tags? or ANY?
                // Standard search usually is ANY (OR), but specific filtering is ALL (AND).
                // Design says "tag filtering", usually implies AND for tags.
                query.tags.forEach((tag, index) => {
                    const alias = `tag_${index}`
                    qb.innerJoin('post.tags', alias, `${alias}.name = :tag_${index} OR ${alias}.slug = :tag_${index}`, { [`tag_${index}`]: tag })
                })
            }

            // 4. Sorting
            if (query.sortBy === 'views') {
                qb.orderBy('post.views', 'DESC')
            } else if (query.sortBy === 'publishedAt') {
                qb.orderBy('post.publishedAt', 'DESC')
            } else {
                // Relevance (Default to publishedAt for now until we have full-text engine)
                qb.orderBy('post.publishedAt', 'DESC')
            }

            // 5. Multi-language deduplication logic
            // Implementation: Since we don't have a specific "canonical" field but share translationId,
            // we fetch raw results and process them. However, for pagination to work correctly,
            // we should ideally do this in SQL.

            // Simplification for MVP: If language is provided, we filter by that language strictly?
            // The design says "Priority show current language, but don't duplicate".
            // If we only filter by language, we might miss articles that are only in other languages.

            // For now, let's allow all languages if no language is specified, or if we want global search.
            // If language IS specified, we use it as a priority hint but not a hard filter?
            // Actually, most users expect results in their language.

            if (query.language) {
                // Multi-language aggregation logic:
                // 1. Show posts in the target language.
                // 2. Show posts in other languages ONLY IF there is no version in the target language for that cluster.
                // 3. Unique posts (translationId is null) are always shown.
                qb.andWhere(new Brackets((sub: WhereExpressionBuilder) => {
                    sub.where('post.language = :language', { language: query.language })
                        .orWhere(new Brackets((ss: WhereExpressionBuilder) => {
                            ss.where('post.translationId IS NOT NULL')
                                .andWhere('post.language != :language', { language: query.language })
                                .andWhere((subQb: SelectQueryBuilder<Post>) => {
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

            // Pagination
            applyPagination(qb, query)

            const [items, total] = await qb.getManyAndCount()

            // 处理作者哈希并保护隐私
            const session = event.context?.auth
            const isUserAdmin = session?.user && isAdmin(session.user.role)
            await processAuthorsPrivacy(items, !!isUserAdmin)

            return success(paginate(items, total, query.page, query.limit))
        },
    })
})
