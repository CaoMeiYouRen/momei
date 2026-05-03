/**
 * 创作者数据统计响应类型
 */
export interface PublishingTrendPoint {
    /** ISO 日期（周一或月初） */
    periodStart: string
    /** 该周期内发布数（翻译簇去重） */
    count: number
}

export interface DistributionTrendPoint {
    /** ISO 日期（周一） */
    periodStart: string
    /** succeeded + failed（不含进行中/已取消中间态） */
    total: number
    succeeded: number
    failed: number
}

export interface DistributionChannelStats {
    /** 站点是否配置了该渠道（查 settings 表，非数据推断） */
    enabled: boolean
    /** 所选窗口内整体成功率，值域 0-1；无事件时返回 0 */
    overallSuccessRate: number
    trend: DistributionTrendPoint[]
}

export interface CreatorStatsResponse {
    /** 时间窗口（天） */
    range: 7 | 30 | 90
    /** 聚合粒度 */
    aggregationGranularity: 'week' | 'month'
    timezone: string
    /** 发文产出 */
    publishing: {
        /** 已发布文章总数（翻译簇去重） */
        totalPublished: number
        /** 草稿存量（当前过滤作者的聚合标量） */
        draftCount: number
        /** 按周或月聚合的发文趋势 */
        trend: PublishingTrendPoint[]
    }
    /** 分发效果 */
    distribution: {
        /** WechatSync 分发统计，null 表示渠道未启用或无数据 */
        wechatsync: DistributionChannelStats | null
        /** Hexo 远程仓库同步统计，null 表示渠道未启用或无数据 */
        hexoRepositorySync: DistributionChannelStats | null
    }
    /** 生成时间 ISO 字符串 */
    generatedAt: string
}
