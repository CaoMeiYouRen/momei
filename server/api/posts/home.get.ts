/**
 * GET /api/posts/home — 首页文章聚合端点
 *
 * 返回首页所需的三个文章区块：
 * - `items` (latest): 最新文章（置顶优先，按 publishedAt DESC，上限 3 篇）
 * - `popular`: 全站热门（按 Post.views 累计值 DESC，上限 3 篇）
 * - `hot`: 近期热门（基于 post_view_hourly 聚合近 365 天 views 增量，上限 3 篇）
 *
 * ## 缓存策略
 * - 走 runtime 缓存（默认 60s TTL），键值按 language 复合。
 *
 * ## 合并背景
 * 此前首页三个区块分别调用 /api/posts/home、/api/posts（popular）、/api/posts/hot，
 * 响应结构不一致且多出网络开销。合并后统一为单端点、单缓存键、单次数据库交互窗口。
 */
import { z } from 'zod'
import dayjs from 'dayjs'
import { dataSource, ensureDatabaseConnectionReady } from '@/server/database'
import { Post } from '@/server/entities/post'
import { PostViewHourly } from '@/server/entities/post-view-hourly'
import { applyPostVisibilityFilter, rethrowPostAccessError } from '@/server/utils/post-access'
import { applyPostsReadModelFromMetadata } from '@/server/utils/post-metadata'
import { applyPostOrdering } from '@/server/utils/post-ordering'
import { applyPostListSelect, applyPublishedPostLanguageFallbackFilter } from '@/server/utils/post-list-query'
import { buildRuntimeApiCacheKey, withRuntimeApiCache } from '@/server/utils/api-runtime-cache'
import { success } from '@/server/utils/response'
import { processAuthorsPrivacy } from '@/server/utils/author'
import { isAdmin } from '@/utils/shared/roles'
import {
    HOMEPAGE_LATEST_POST_LIMIT,
    HOMEPAGE_PINNED_POST_LIMIT,
    MAX_PINNED_POSTS,
} from '@/utils/shared/post-pinning'

const HOME_POSTS_CACHE_TTL_SECONDS = 60
const HOME_POSTS_CACHE_NAMESPACE = 'posts:home'
const POPULAR_POST_LIMIT = 3
const HOT_POST_LIMIT = 3
const HOT_POST_RANGE_DAYS = 365

const homePostQuerySchema = z.object({
    language: z.string().optional(),
})

function stripHomepageAuthorPrivateFields(items: Post[]) {
    for (const item of items) {
        if (!item.author) {
            continue
        }

        Reflect.deleteProperty(item.author, 'email')
        Reflect.deleteProperty(item.author, 'emailHash')
    }
}

function buildHomePostsCacheKey(language?: string) {
    return buildRuntimeApiCacheKey(HOME_POSTS_CACHE_NAMESPACE, language ?? 'default')
}

export default defineEventHandler(async (event) => {
    const query = await getValidatedQuery(event, (value) => homePostQuerySchema.parse(value))
    const user = event.context?.user
    const isSharedPublicResponse = !event.context?.auth?.user && !user
    const cacheKey = buildHomePostsCacheKey(query.language)

    return withRuntimeApiCache({
        event,
        key: cacheKey,
        namespace: HOME_POSTS_CACHE_NAMESPACE,
        ttlSeconds: HOME_POSTS_CACHE_TTL_SECONDS,
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

            // ── 1. Latest Posts （已有逻辑，保持向后兼容） ──────────────
            const latestQb = applyPostListSelect(postRepo.createQueryBuilder('post'), {
                includeAuthorEmail: false,
            })

            try {
                await applyPostVisibilityFilter(latestQb, user, 'public')
            } catch (error) {
                rethrowPostAccessError(error)
            }

            applyPublishedPostLanguageFallbackFilter(latestQb, query.language)

            applyPostOrdering(latestQb, {
                alias: 'post',
                orderBy: 'publishedAt',
                order: 'DESC',
                prioritizePinned: true,
            })

            latestQb.take(HOMEPAGE_LATEST_POST_LIMIT + MAX_PINNED_POSTS)

            const latestRawItems = await latestQb.getMany()
            applyPostsReadModelFromMetadata(latestRawItems)
            stripHomepageAuthorPrivateFields(latestRawItems)

            const latestItems: Post[] = []
            let pinnedCount = 0

            for (const item of latestRawItems) {
                if (item.isPinned) {
                    if (pinnedCount >= HOMEPAGE_PINNED_POST_LIMIT) {
                        continue
                    }

                    pinnedCount += 1
                }

                latestItems.push(item)

                if (latestItems.length >= HOMEPAGE_LATEST_POST_LIMIT) {
                    break
                }
            }

            // ── 2. Popular Posts （全站热门） ────────────────────────────
            const popularQb = applyPostListSelect(postRepo.createQueryBuilder('post'), {
                includeAuthorEmail: false,
            })

            try {
                await applyPostVisibilityFilter(popularQb, user, 'public')
            } catch (error) {
                rethrowPostAccessError(error)
            }

            applyPublishedPostLanguageFallbackFilter(popularQb, query.language)

            applyPostOrdering(popularQb, {
                alias: 'post',
                orderBy: 'views',
                order: 'DESC',
                prioritizePinned: false,
            })

            popularQb
                .andWhere('post.isPinned = :isPinned', { isPinned: false })
                .take(POPULAR_POST_LIMIT)

            const popularItems = await popularQb.getMany()
            applyPostsReadModelFromMetadata(popularItems)
            stripHomepageAuthorPrivateFields(popularItems)

            // ── 3. Hot Posts （近期热门） ──────────────────────────────
            const windowStart = dayjs().subtract(HOT_POST_RANGE_DAYS, 'day').startOf('day').toDate()

            const viewRows = await viewHourlyRepo
                .createQueryBuilder('hourly')
                .select('hourly.postId', 'postId')
                .addSelect('SUM(hourly.views)', 'totalViews')
                .where('hourly.bucketHourUtc >= :windowStart', { windowStart })
                .groupBy('hourly.postId')
                .having('SUM(hourly.views) > 0')
                .orderBy('totalViews', 'DESC')
                .limit(HOT_POST_LIMIT)
                .getRawMany<{ postId: string, totalViews: string }>()

            let hotItems: Post[] = []

            if (viewRows.length > 0) {
                const hotPostIds = viewRows.map((row) => row.postId)

                // 去掉已出现在最新文章中的条目
                const latestIdSet = new Set(latestItems.map((p) => p.id))
                const filteredIds = hotPostIds.filter((id) => !latestIdSet.has(id)).slice(0, HOT_POST_LIMIT)

                if (filteredIds.length > 0) {
                    const hotQb = applyPostListSelect(postRepo.createQueryBuilder('post'), {
                        includeAuthorEmail: false,
                    })
                        .where('post.id IN (:...postIds)', { postIds: filteredIds })

                    try {
                        await applyPostVisibilityFilter(hotQb, user, 'public')
                    } catch (error) {
                        rethrowPostAccessError(error)
                    }

                    const rawHotItems = await hotQb.getMany()

                    // 按 filteredIds 顺序排序
                    const postIdOrder = new Map(filteredIds.map((id, index) => [id, index]))
                    rawHotItems.sort((a, b) => (postIdOrder.get(a.id) ?? 0) - (postIdOrder.get(b.id) ?? 0))

                    applyPostsReadModelFromMetadata(rawHotItems)
                    stripHomepageAuthorPrivateFields(rawHotItems)

                    hotItems = rawHotItems
                }
            }

            // ── 作者隐私处理 ──────────────────────────────────────────
            const isUserAdmin = user ? isAdmin(user.role) : false
            const allItems = [...latestItems, ...popularItems, ...hotItems]
            await processAuthorsPrivacy(allItems, isUserAdmin)

            return success({
                items: latestItems,
                popular: popularItems,
                hot: hotItems,
            })
        },
    })
})
