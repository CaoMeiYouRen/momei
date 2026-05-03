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
    const aggregationGranularity: 'week' | 'month' = range === 90 ? 'month' : 'week'

    // 确定 authorId 过滤：author 角色固定为本人，忽略传入参数；admin 可选择过滤
    const effectiveAuthorId = isAdmin(session.user.role) ? query.authorId : session.user.id

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
    const truncFn = aggregationGranularity === 'week' ? 'DATE_TRUNC(\'week\', post.publishedAt)' : 'DATE_TRUNC(\'month\', post.publishedAt)'

    const trendQuery = postRepo
        .createQueryBuilder('post')
        .select(truncFn, 'periodStart')
        .addSelect('COUNT(DISTINCT COALESCE(post.translationId, post.id))', 'count')
        .where('post.status = :status', { status: PostStatus.PUBLISHED })
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

    // ====== 4. 分发事件统计 ======
    // 查询 published 文章的分发元数据，按最后事件周分桶
    const currentEnd = dayjs().tz(resolvedTimeZone).endOf('day')
    const maxWindowDays = Math.max(7, 30, 90) * 2 // 参照 content-insights 2x 窗口
    const minWindowStart = currentEnd.startOf('day').subtract(maxWindowDays, 'day').toDate()

    const distQuery = postRepo
        .createQueryBuilder('post')
        .select(`DATE_TRUNC('week', GREATEST(
            COALESCE(NULLIF(post.metadata ->> 'integration', '')::jsonb ->> 'distribution', '')::jsonb -> 'channels' -> 'wechatsync' ->> 'lastSuccessAt',
            COALESCE(NULLIF(post.metadata ->> 'integration', '')::jsonb ->> 'distribution', '')::jsonb -> 'channels' -> 'wechatsync' ->> 'lastFailureAt'),
            COALESCE(NULLIF(post.metadata ->> 'integration', '')::jsonb ->> 'hexoRepositorySync' ->> 'lastSyncedAt',
            COALESCE(NULLIF(post.metadata ->> 'integration', '')::jsonb ->> 'hexoRepositorySync' ->> 'lastFailureAt')
        )`, 'weekStart')
        .addSelect(
            'SUM(CASE WHEN (COALESCE(NULLIF(post.metadata ->> \'integration\', \'\')::jsonb ->> \'distribution\', \'\')::jsonb -> \'channels\' -> \'wechatsync\' ->> \'lastSuccessAt\') IS NOT NULL THEN 1 ELSE 0 END)',
            'wechatsyncSuccess',
        )
        .addSelect(
            'SUM(CASE WHEN (COALESCE(NULLIF(post.metadata ->> \'integration\', \'\')::jsonb ->> \'distribution\', \'\')::jsonb -> \'channels\' -> \'wechatsync\' ->> \'lastFailureAt\') IS NOT NULL THEN 1 ELSE 0 END)',
            'wechatsyncFail',
        )
        .addSelect(
            'SUM(CASE WHEN (COALESCE(NULLIF(post.metadata ->> \'integration\', \'\')::jsonb ->> \'hexoRepositorySync\' ->> \'lastSyncedAt\') IS NOT NULL THEN 1 ELSE 0 END)',
            'hexoSuccess',
        )
        .addSelect(
            'SUM(CASE WHEN (COALESCE(NULLIF(post.metadata ->> \'integration\', \'\')::jsonb ->> \'hexoRepositorySync\' ->> \'lastFailureAt\') IS NOT NULL THEN 1 ELSE 0 END)',
            'hexoFail',
        )
        .where('post.status = :status', { status: PostStatus.PUBLISHED })
        .andWhere('post.publishedAt BETWEEN :minWindowStart AND :maxWindowEnd', {
            minWindowStart,
            maxWindowEnd: currentEnd.toDate(),
        })
        .andWhere(
            `(
                COALESCE(NULLIF(post.metadata ->> 'integration', '')::jsonb ->> 'distribution', '')::jsonb -> 'channels' -> 'wechatsync' ->> 'lastSuccessAt' IS NOT NULL
                OR COALESCE(NULLIF(post.metadata ->> 'integration', '')::jsonb ->> 'distribution', '')::jsonb -> 'channels' -> 'wechatsync' ->> 'lastFailureAt' IS NOT NULL
                OR COALESCE(NULLIF(post.metadata ->> 'integration', '')::jsonb ->> 'hexoRepositorySync' ->> 'lastSyncedAt') IS NOT NULL
                OR COALESCE(NULLIF(post.metadata ->> 'integration', '')::jsonb ->> 'hexoRepositorySync' ->> 'lastFailureAt') IS NOT NULL
            )`,
        )
        .groupBy(`DATE_TRUNC('week', GREATEST(
            COALESCE(NULLIF(post.metadata ->> 'integration', '')::jsonb ->> 'distribution', '')::jsonb -> 'channels' -> 'wechatsync' ->> 'lastSuccessAt',
            COALESCE(NULLIF(post.metadata ->> 'integration', '')::jsonb ->> 'distribution', '')::jsonb -> 'channels' -> 'wechatsync' ->> 'lastFailureAt'),
            COALESCE(NULLIF(post.metadata ->> 'integration', '')::jsonb ->> 'hexoRepositorySync' ->> 'lastSyncedAt',
            COALESCE(NULLIF(post.metadata ->> 'integration', '')::jsonb ->> 'hexoRepositorySync' ->> 'lastFailureAt')
        )`)
        .orderBy('"weekStart"', 'ASC')

    if (effectiveAuthorId) {
        distQuery.andWhere('post.authorId = :authorId', { authorId: effectiveAuthorId })
    }

    const distRows = await distQuery.getRawMany<{
        weekStart: string
        wechatsyncSuccess: string
        wechatsyncFail: string
        hexoSuccess: string
        hexoFail: string
    }>()

    const distributionRawRows = distRows.map((row) => ({
        weekStart: new Date(row.weekStart),
        wechatsyncSuccess: Number(row.wechatsyncSuccess),
        wechatsyncFail: Number(row.wechatsyncFail),
        hexoSuccess: Number(row.hexoSuccess),
        hexoFail: Number(row.hexoFail),
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
