/**
 * GET /api/posts/hot — 近期热门文章（基于 post_view_hourly 聚合）
 *
 * 按指定时间窗口（默认 365 天）聚合 post_view_hourly 中的阅读增量，
 * 返回热度最高的前 3 篇文章。用于首页"近期热门"区块。
 *
 * ## 缓存策略
 * - 走 runtime 缓存（默认 60s TTL），键值按 range + excludeIds 复合。
 *
 * ## 与现有 /api/posts?orderBy=views 的区别
 * - 本端点基于 post_view_hourly 增量聚合，反映近期热度；
 * - 现有端点基于 Post.views 累计值，反映全站历史热度。
 */
import { z } from 'zod'
import { dataSource, ensureDatabaseConnectionReady } from '@/server/database'
import { Post } from '@/server/entities/post'
import { PostViewHourly } from '@/server/entities/post-view-hourly'
import { applyPostVisibilityFilter, rethrowPostAccessError } from '@/server/utils/post-access'
import { applyPostsReadModelFromMetadata } from '@/server/utils/post-metadata'
import { applyPostListSelect } from '@/server/utils/post-list-query'
import { buildRuntimeApiCacheKey, withRuntimeApiCache } from '@/server/utils/api-runtime-cache'
import { success } from '@/server/utils/response'
import { processAuthorsPrivacy } from '@/server/utils/author'
import { isAdmin } from '@/utils/shared/roles'

const HOT_POSTS_CACHE_TTL_SECONDS = 60
const HOT_POSTS_CACHE_NAMESPACE = 'posts:hot'
const HOT_POST_LIST_LIMIT = 3

const excludeIdsSchema = z.preprocess((val) => {
    if (val === '' || val === undefined || val === null) {
        return undefined
    }

    const values = Array.isArray(val) ? val : [val]

    return values
        .flatMap((item) => typeof item === 'string'
            ? item.split(',').map((s) => s.trim()).filter(Boolean)
            : [])
}, z.array(z.string()).optional())

const hotPostQuerySchema = z.object({
    range: z.coerce.number().int().min(1).max(365).optional().default(365),
    excludeIds: excludeIdsSchema,
})

function buildHotPostsCacheKey(range: number, excludeIds?: string[]) {
    return buildRuntimeApiCacheKey(HOT_POSTS_CACHE_NAMESPACE, JSON.stringify({
        range,
        excludeIds: excludeIds ?? [],
    }))
}

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (value) => hotPostQuerySchema.parse(value))
    const user = event.context?.user
    const isSharedPublicResponse = !event.context?.auth?.user && !user
    const cacheKey = buildHotPostsCacheKey(query.range, query.excludeIds)

    return withRuntimeApiCache({
        event,
        key: cacheKey,
        namespace: HOT_POSTS_CACHE_NAMESPACE,
        ttlSeconds: HOT_POSTS_CACHE_TTL_SECONDS,
        isSharedPublicResponse,
        loader: async () => {
            const databaseReady = await ensureDatabaseConnectionReady()
            if (!databaseReady) {
                throw createError({
                    statusCode: 503,
                    statusMessage: 'Database unavailable',
                })
            }

            const postRepo = dataSource.getRepository(Post)
            const viewHourlyRepo = dataSource.getRepository(PostViewHourly)

            // 计算时间窗口：从当前时间向前推 range 天
            const windowStart = new Date()
            windowStart.setDate(windowStart.getDate() - query.range)
            windowStart.setHours(0, 0, 0, 0)

            // 1. 从 post_view_hourly 聚合近 range 天的 views 增量
            const viewRows = await viewHourlyRepo
                .createQueryBuilder('hourly')
                .select('hourly.postId', 'postId')
                .addSelect('SUM(hourly.views)', 'totalViews')
                .where('hourly.bucketHourUtc >= :windowStart', { windowStart })
                .groupBy('hourly.postId')
                .having('SUM(hourly.views) > 0')
                .orderBy('totalViews', 'DESC')
                .limit(HOT_POST_LIST_LIMIT + (query.excludeIds?.length ?? 0))
                .getRawMany<{ postId: string, totalViews: string }>()

            if (viewRows.length === 0) {
                return success({ items: [] })
            }

            // 2. 提取 postId 列表，排除 requested excludeIds
            let postIds = viewRows.map((row) => row.postId)
            if (query.excludeIds && query.excludeIds.length > 0) {
                const excludeSet = new Set(query.excludeIds)
                postIds = postIds.filter((id) => !excludeSet.has(id))
            }

            // 3. 截取前 HOT_POST_LIST_LIMIT 篇
            postIds = postIds.slice(0, HOT_POST_LIST_LIMIT)

            if (postIds.length === 0) {
                return success({ items: [] })
            }

            // 4. 查询完整的 Post 数据
            const qb = applyPostListSelect(postRepo.createQueryBuilder('post'), {
                includeAuthorEmail: false,
            })
                .where('post.id IN (:...postIds)', { postIds })

            try {
                await applyPostVisibilityFilter(qb, user, 'public')
            } catch (error) {
                rethrowPostAccessError(error)
            }

            const items = await qb.getMany()

            // 5. 按 postIds 顺序排序（保持热度排序）
            const postIdOrder = new Map(postIds.map((id, index) => [id, index]))
            items.sort((a, b) => (postIdOrder.get(a.id) ?? 0) - (postIdOrder.get(b.id) ?? 0))

            applyPostsReadModelFromMetadata(items)

            // 处理作者隐私
            const isUserAdmin = user ? isAdmin(user.role) : false
            await processAuthorsPrivacy(items, isUserAdmin)

            return success({ items })
        },
    })
})
