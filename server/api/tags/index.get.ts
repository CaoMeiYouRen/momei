/**
 * GET /api/tags — 公开标签列表
 *
 * ## 与 categories 的共享策略
 * - 走 `applyTaxonomyPublicListFilters` / `applyTaxonomyPublicListOrdering` / `buildTaxonomyPublicListCacheKey`
 *   共享层，与 `/api/categories` 共用同套缓存/排序/过滤策略。
 *
 * ## 文章计数子查询
 * - 通过 `buildTagPostCountSubquery` 注入关联文章数（仅统计已发布、可见文章）。
 * - Tag 与 Post 是多对多关系，子查询需要 JOIN `post_tags_tag` 中间表。
 */
import { ensureDatabaseConnectionReady } from '@/server/database'
import { tagQuerySchema } from '@/utils/schemas/tag'
import { success, paginate } from '@/server/utils/response'
import { queryTagPublicList } from '@/server/utils/tag-public-list'
import { withRuntimeApiCache } from '@/server/utils/api-runtime-cache'
import {
    buildTaxonomyPublicListCacheKey,
} from '@/server/utils/taxonomy-public-list'

const TAG_PUBLIC_LIST_CACHE_NAMESPACE = 'tags:public-list'
const TAG_PUBLIC_LIST_CACHE_TTL_SECONDS = 60

function buildTagPublicListCacheKey(query: {
    aggregate?: boolean
    language?: null | string
    limit: number
    order?: null | string
    orderBy?: null | string
    page: number
    search?: null | string
    translationId?: null | string
}) {
    return buildTaxonomyPublicListCacheKey({
        namespace: TAG_PUBLIC_LIST_CACHE_NAMESPACE,
        query,
    })
}

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (q) => tagQuerySchema.parse(q))
    const cacheKey = buildTagPublicListCacheKey(query)

    return withRuntimeApiCache({
        event,
        key: cacheKey,
        namespace: TAG_PUBLIC_LIST_CACHE_NAMESPACE,
        ttlSeconds: TAG_PUBLIC_LIST_CACHE_TTL_SECONDS,
        isSharedPublicResponse: true,
        loader: async () => {
            const databaseReady = await ensureDatabaseConnectionReady()
            if (!databaseReady) {
                throw createError({
                    statusCode: 503,
                    statusMessage: 'Database unavailable',
                })
            }

            const result = await queryTagPublicList(query)

            return success(paginate(result.items, result.total, result.page, result.limit))
        },
    })
})
