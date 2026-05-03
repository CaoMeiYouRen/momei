import dayjs from 'dayjs'
import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import {
    buildCreatorStats,
    resolveDistributionChannelEnabled,
} from '@/server/utils/creator-stats'
import type { CreatorStatsResponse } from '@/types/creator-stats'
import { PostStatus } from '@/types/post'
import { isAdmin } from '@/utils/shared/roles'

const querySchema = z.object({
    range: z.coerce.number().pipe(z.union([z.literal(7), z.literal(30), z.literal(90)])).optional().default(30),
    timezone: z.string().trim().min(1).max(64).optional().default('UTC'),
    authorId: z.uuid().optional(),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const query = querySchema.parse(getQuery(event))

    const postRepo = dataSource.getRepository(Post)
    const resolvedTimeZone = query.timezone
    const range = query.range
    const GRANULARITY_MAP = {
        '7': 'day' as const,
        '30': 'week' as const,
        '90': 'month' as const,
    }
    const aggregationGranularity = GRANULARITY_MAP[range]

    // 确定 authorId 过滤：author 角色固定为本人，忽略传入参数；admin 可选择过滤
    const effectiveAuthorId = isAdmin(session.user.role) ? query.authorId : session.user.id

    // 当前窗口边界（用于发文趋势和分发统计的日期过滤）
    const currentEnd = dayjs().tz(resolvedTimeZone).endOf('day')
    const windowStart = currentEnd.startOf('day').subtract(range - 1, 'day').toDate()

    // ====== 1. 已发布总数（翻译簇去重） ======
    const publishedQuery = postRepo
        .createQueryBuilder('post')
        .select('COUNT(DISTINCT COALESCE(post.translationId, post.id))', 'count')
        .where('post.status = :status', { status: PostStatus.PUBLISHED })

    if (effectiveAuthorId) {
        publishedQuery.andWhere('post.authorId = :authorId', { authorId: effectiveAuthorId })
    }

    const publishedResult = await publishedQuery.getRawOne<{ count: string }>()
    const totalPublished = Number(publishedResult?.count ?? 0)

    // ====== 2. 草稿存量 ======
    const draftQuery = postRepo
        .createQueryBuilder('post')
        .select('COUNT(*)', 'count')
        .where('post.status = :status', { status: PostStatus.DRAFT })

    if (effectiveAuthorId) {
        draftQuery.andWhere('post.authorId = :authorId', { authorId: effectiveAuthorId })
    }

    const draftResult = await draftQuery.getRawOne<{ count: string }>()
    const draftCount = Number(draftResult?.count ?? 0)

    // ====== 3. 发文趋势 ======
    const TRUNC_FN_MAP = {
        day: 'DATE(post.publishedAt)',
        week: 'DATE_TRUNC(\'week\', post.publishedAt)',
        month: 'DATE_TRUNC(\'month\', post.publishedAt)',
    } as const
    const truncFn = TRUNC_FN_MAP[aggregationGranularity]

    const trendQuery = postRepo
        .createQueryBuilder('post')
        .select(truncFn, 'periodStart')
        .addSelect('COUNT(DISTINCT COALESCE(post.translationId, post.id))', 'count')
        .where('post.status = :status', { status: PostStatus.PUBLISHED })
        .andWhere('post.publishedAt >= :windowStart', { windowStart })
        .groupBy(truncFn)
        .orderBy(truncFn, 'ASC')

    if (effectiveAuthorId) {
        trendQuery.andWhere('post.authorId = :authorId', { authorId: effectiveAuthorId })
    }

    const trendRows = await trendQuery.getRawMany<{ periodStart: string, count: string }>()
    const publishingRawRows = trendRows.map((row) => ({
        periodStart: new Date(row.periodStart),
        count: Number(row.count),
    }))

    // ====== 4. 分发事件统计（TypeScript 端聚合） ======
    const maxWindowDays = Math.max(7, 30, 90) * 2
    const distWindowStart = currentEnd.startOf('day').subtract(maxWindowDays, 'day').toDate()

    const distBaseQuery = postRepo
        .createQueryBuilder('post')
        .select(['post.id', 'post.metadata', 'post.publishedAt'])
        .where('post.status = :status', { status: PostStatus.PUBLISHED })
        .andWhere('post.publishedAt BETWEEN :distWindowStart AND :maxWindowEnd', {
            distWindowStart,
            maxWindowEnd: currentEnd.toDate(),
        })

    if (effectiveAuthorId) {
        distBaseQuery.andWhere('post.authorId = :authorId', { authorId: effectiveAuthorId })
    }

    const distPosts = await distBaseQuery.getMany()

    // 在 TypeScript 端提取分发事件并按周分桶
    interface DistBucket {
        weekStart: string
        wechatsyncSuccess: number
        wechatsyncFail: number
        hexoSuccess: number
        hexoFail: number
    }

    const bucketMap = new Map<string, DistBucket>()

    for (const post of distPosts) {
        const integration = post.metadata?.integration
        if (!integration) {
            continue
        }

        const wcs = integration.distribution?.channels?.wechatsync
        const hexo = integration.hexoRepositorySync

        function addToBucket(eventDate: Date, field: keyof DistBucket) {
            const d = dayjs(eventDate)
            // 计算周一
            const dayOfWeek = d.day()
            const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            const monday = d.startOf('day').subtract(offset, 'day').format('YYYY-MM-DD')

            const bucket = bucketMap.get(monday)
            if (bucket) {
                bucket[field]++
            } else {
                bucketMap.set(monday, {
                    weekStart: monday,
                    wechatsyncSuccess: 0,
                    wechatsyncFail: 0,
                    hexoSuccess: 0,
                    hexoFail: 0,
                    [field]: 1,
                })
            }
        }

        if (wcs?.lastSuccessAt) {
            const d = new Date(wcs.lastSuccessAt)
            if (d >= distWindowStart) {
                addToBucket(d, 'wechatsyncSuccess')
            }
        }
        if (wcs?.lastFailureAt) {
            const d = new Date(wcs.lastFailureAt)
            if (d >= distWindowStart) {
                addToBucket(d, 'wechatsyncFail')
            }
        }
        if (hexo?.lastSyncedAt) {
            const d = new Date(hexo.lastSyncedAt)
            if (d >= distWindowStart) {
                addToBucket(d, 'hexoSuccess')
            }
        }
        if (hexo?.lastFailureAt) {
            const d = new Date(hexo.lastFailureAt)
            if (d >= distWindowStart) {
                addToBucket(d, 'hexoFail')
            }
        }
    }

    const distributionRawRows = Array.from(bucketMap.values())
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
        .map((b) => ({
            weekStart: new Date(b.weekStart),
            wechatsyncSuccess: b.wechatsyncSuccess,
            wechatsyncFail: b.wechatsyncFail,
            hexoSuccess: b.hexoSuccess,
            hexoFail: b.hexoFail,
        }))

    // ====== 5. 渠道启用状态 ======
    const channelEnabled = await resolveDistributionChannelEnabled()

    // ====== 6. 构建响应 ======
    const response: CreatorStatsResponse = buildCreatorStats({
        range,
        timezone: resolvedTimeZone,
        aggregationGranularity,
        totalPublished,
        draftCount,
        publishingRawRows,
        distributionRawRows,
        channelEnabled,
    })

    return response
})
