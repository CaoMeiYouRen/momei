/**
 * GET /api/categories — 公开分类列表
 *
 * ## 缓存与复用
 * - 走 `applyTaxonomyPublicListFilters` / `applyTaxonomyPublicListOrdering` / `buildTaxonomyPublicListCacheKey`
 *   共享层，与 `/api/tags` 共用同套缓存/排序/过滤策略。
 * - 缓存键按 `language` 区分，命中时旁路数据库查询。
 *
 * ## 文章计数子查询
 * - 通过 `buildCategoryPostCountSubquery` 注入关联文章数（仅统计已发布、可见文章）。
 */
import { ensureDatabaseConnectionReady } from '@/server/database'
import { categoryQuerySchema } from '@/utils/schemas/category'
import { success, paginate } from '@/server/utils/response'
import { queryCategoryPublicList } from '@/server/utils/category-public-list'
import { withRuntimeApiCache } from '@/server/utils/api-runtime-cache'
import {
    buildTaxonomyPublicListCacheKey,
} from '@/server/utils/taxonomy-public-list'

const CATEGORY_PUBLIC_LIST_CACHE_NAMESPACE = 'categories:public-list'
const CATEGORY_PUBLIC_LIST_CACHE_TTL_SECONDS = 60

function buildCategoryPublicListCacheKey(query: {
    aggregate?: boolean
    language?: null | string
    limit: number
    order?: null | string
    orderBy?: null | string
    page: number
    parentId?: null | string
    search?: null | string
    translationId?: null | string
}) {
    return buildTaxonomyPublicListCacheKey({
        namespace: CATEGORY_PUBLIC_LIST_CACHE_NAMESPACE,
        query,
        extraSegments: [query.parentId ?? 'all'],
    })
}

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => categoryQuerySchema.parse(q))
    const cacheKey = buildCategoryPublicListCacheKey(query)

    return withRuntimeApiCache({
        event,
        key: cacheKey,
        namespace: CATEGORY_PUBLIC_LIST_CACHE_NAMESPACE,
        ttlSeconds: CATEGORY_PUBLIC_LIST_CACHE_TTL_SECONDS,
        isSharedPublicResponse: true,
        loader: async () => {
            const databaseReady = await ensureDatabaseConnectionReady()
            if (!databaseReady) {
                throw createError({
                    statusCode: 503,
                    statusMessage: 'Database unavailable',
                })
            }

            const result = await queryCategoryPublicList(query)

            return success(paginate(result.items, result.total, result.page, result.limit))
        },
    })
})
