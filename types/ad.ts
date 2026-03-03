/**
 * 广告系统相关类型定义
 *
 * @author Claude Code
 * @date 2026-03-03
 */

/**
 * 广告格式枚举
 */
export enum AdFormat {
    DISPLAY = 'display', // 展示广告
    NATIVE = 'native', // 原生广告
    VIDEO = 'video', // 视频广告
    RESPONSIVE = 'responsive', // 响应式广告
}

/**
 * 广告位置枚举
 */
export enum AdLocation {
    HEADER = 'header', // 页眉
    SIDEBAR = 'sidebar', // 侧边栏
    CONTENT_TOP = 'content_top', // 内容顶部
    CONTENT_MIDDLE = 'content_middle', // 内容中部
    CONTENT_BOTTOM = 'content_bottom', // 内容底部
    FOOTER = 'footer', // 页脚
}

/**
 * 广告活动状态枚举
 */
export enum CampaignStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    PAUSED = 'paused',
    ENDED = 'ended',
}

/**
 * 外链状态枚举
 */
export enum LinkStatus {
    ACTIVE = 'active',
    BLOCKED = 'blocked',
    EXPIRED = 'expired',
}

/**
 * 广告位元数据接口
 */
export interface AdPlacementMetadata {
    // Google AdSense
    slot?: string
    format?: string
    // 百度联盟
    slotId?: string
    width?: number
    height?: number
    // 腾讯广告
    appId?: string
    placementId?: string
    adType?: string // banner, native, feed, etc.
    // 通用
    responsive?: boolean
}

/**
 * 广告位定向规则接口
 */
export interface AdTargeting {
    categories?: string[] // 仅在指定分类显示
    tags?: string[] // 仅在指定标签显示
    locales?: string[] // 仅在指定语言显示
    maxViewsPerSession?: number // 会话内最大展示次数
}

/**
 * 广告活动定向规则接口
 */
export interface CampaignTargeting {
    categories?: string[]
    tags?: string[]
    locales?: string[]
}

/**
 * 外链元数据接口
 */
export interface ExternalLinkMetadata {
    source?: 'post' | 'comment' | 'page' // 来源
    sourceId?: string
    title?: string // 链接标题
    description?: string // 链接描述
    favicon?: string // 网站图标
}

/**
 * 广告适配器配置接口
 */
export type AdAdapterConfig = Record<string, any>

/**
 * 广告展示统计接口
 */
export interface AdStats {
    impressions: number // 展示次数
    clicks: number // 点击次数
    ctr: number // 点击率
    revenue: number // 收益
}
