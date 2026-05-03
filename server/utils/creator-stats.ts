import dayjs from 'dayjs'
import { getSettings } from '@/server/services/setting'
import { SettingKey } from '@/types/setting'
import type {
    CreatorStatsResponse,
    DistributionTrendPoint,
    PublishingTrendPoint,
} from '@/types/creator-stats'

/**
 * 时间段原始数据
 */
interface RawPeriodBucket {
    periodStart: Date
    count: number
}

interface RawDistributionBucket {
    periodStart: Date
    succeeded: number
    failed: number
}

/**
 * 将 Post 的 JSONB metadata 中 wechatsync / hexo 分发事件归入周桶
 */
export function bucketDistributionEvents(
    rows: {
        weekStart: Date
        wechatsyncSuccess: number
        wechatsyncFail: number
        hexoSuccess: number
        hexoFail: number
    }[],
    channel: 'wechatsync' | 'hexo',
): DistributionTrendPoint[] {
    const buckets = new Map<string, RawDistributionBucket>()

    for (const row of rows) {
        const key = dayjs(row.weekStart).format('YYYY-MM-DD')
        const existing = buckets.get(key)
        if (channel === 'wechatsync') {
            if (existing) {
                existing.succeeded += row.wechatsyncSuccess
                existing.failed += row.wechatsyncFail
            } else {
                buckets.set(key, {
                    periodStart: row.weekStart,
                    succeeded: row.wechatsyncSuccess,
                    failed: row.wechatsyncFail,
                })
            }
        } else if (existing) {
            existing.succeeded += row.hexoSuccess
            existing.failed += row.hexoFail
        } else {
            buckets.set(key, {
                periodStart: row.weekStart,
                succeeded: row.hexoSuccess,
                failed: row.hexoFail,
            })
        }
    }

    // 过滤空桶（无事件周不生成数据点）
    return Array.from(buckets.values())
        .filter((b) => b.succeeded > 0 || b.failed > 0)
        .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime())
        .map((b) => ({
            periodStart: dayjs(b.periodStart).format('YYYY-MM-DD'),
            total: b.succeeded + b.failed,
            succeeded: b.succeeded,
            failed: b.failed,
        }))
}

/**
 * 计算整体成功率
 */
export function computeOverallSuccessRate(trend: DistributionTrendPoint[]): number {
    const totalSucceeded = trend.reduce((sum, p) => sum + p.succeeded, 0)
    const totalDone = trend.reduce((sum, p) => sum + p.total, 0)
    return totalDone > 0 ? totalSucceeded / totalDone : 0
}

/**
 * 按天/周/月对发布记录分桶
 */
export function bucketPublishingTrend(
    rows: RawPeriodBucket[],
    granularity: 'day' | 'week' | 'month',
): PublishingTrendPoint[] {
    const buckets = new Map<string, { count: number, periodEnd?: string }>()

    for (const row of rows) {
        const d = dayjs(row.periodStart)
        let periodStart: string
        let periodEnd: string | undefined

        if (granularity === 'day') {
            periodStart = d.format('YYYY-MM-DD')
        } else if (granularity === 'week') {
            const offset = d.day() === 0 ? 6 : d.day() - 1
            const monday = d.startOf('day').subtract(offset, 'day')
            periodStart = monday.format('YYYY-MM-DD')
            periodEnd = monday.add(6, 'day').format('MM-DD')
        } else {
            periodStart = d.startOf('month').format('YYYY-MM')
            periodEnd = d.endOf('month').format('MM-DD')
        }

        const existing = buckets.get(periodStart)
        if (existing) {
            existing.count += row.count
        } else {
            buckets.set(periodStart, { count: row.count, periodEnd })
        }
    }

    return Array.from(buckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([periodStart, { count, periodEnd }]) => ({
            periodStart,
            count,
            ...(periodEnd ? { periodEnd } : {}),
        }))
}

/**
 * 检查分发渠道是否已启用（查 settings 表）
 */
export async function resolveDistributionChannelEnabled(): Promise<{
    wechatsync: boolean
    hexoRepositorySync: boolean
}> {
    const settings = await getSettings([
        SettingKey.HEXO_SYNC_ENABLED,
        // WechatSync 没有独立的启用设置键——它依赖浏览器扩展。
        // 这里始终返回 true，前端 UI 根据数据是否存在来决定展示。
    ])

    return {
        wechatsync: true, // WechatSync 不依赖服务端启用开关
        hexoRepositorySync: settings[SettingKey.HEXO_SYNC_ENABLED] === 'true',
    }
}

/**
 * 构建创作者统计响应
 */
export function buildCreatorStats(params: {
    range: 7 | 30 | 90
    timezone: string
    aggregationGranularity: 'day' | 'week' | 'month'
    totalPublished: number
    draftCount: number
    publishingRawRows: RawPeriodBucket[]
    distributionRawRows: {
        weekStart: Date
        wechatsyncSuccess: number
        wechatsyncFail: number
        hexoSuccess: number
        hexoFail: number
    }[]
    channelEnabled: { wechatsync: boolean, hexoRepositorySync: boolean }
}): CreatorStatsResponse {
    const publishingTrend = bucketPublishingTrend(params.publishingRawRows, params.aggregationGranularity)

    const wechatsyncTrend = bucketDistributionEvents(params.distributionRawRows, 'wechatsync')
    const hexoTrend = bucketDistributionEvents(params.distributionRawRows, 'hexo')

    return {
        range: params.range,
        aggregationGranularity: params.aggregationGranularity,
        timezone: params.timezone,
        publishing: {
            totalPublished: params.totalPublished,
            draftCount: params.draftCount,
            trend: publishingTrend,
        },
        distribution: {
            wechatsync: params.channelEnabled.wechatsync
                ? {
                    enabled: true,
                    overallSuccessRate: computeOverallSuccessRate(wechatsyncTrend),
                    trend: wechatsyncTrend,
                }
                : null,
            hexoRepositorySync: params.channelEnabled.hexoRepositorySync
                ? {
                    enabled: true,
                    overallSuccessRate: computeOverallSuccessRate(hexoTrend),
                    trend: hexoTrend,
                }
                : null,
        },
        generatedAt: new Date().toISOString(),
    }
}
