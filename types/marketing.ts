import type { MarketingCampaignStatus, MarketingCampaignType } from '@/utils/shared/notification'

/**
 * Listmonk 分发配置
 */
export interface ListmonkDistributionConfig {
    provider?: string
    remoteCampaignId?: number
    action?: string
    listIds?: number[]
    lastAttemptAt?: string
    lastSuccessfulAt?: string
    lastError?: string | null
    manualAction?: string | null
    failureCode?: string
}

/**
 * 外部分发配置
 */
export interface ExternalDistributionConfig {
    listmonk?: ListmonkDistributionConfig
}

/**
 * 营销推送目标条件
 */
export interface MarketingCampaignTargetCriteria {
    categoryIds?: string[]
    tagIds?: string[]
    articleLocale?: string
    articleId?: string
    articleTitle?: string
    authorName?: string
    categoryName?: string
    publishDate?: string
    articleLink?: string
    externalDistribution?: ExternalDistributionConfig
}

/**
 * 营销推送记录
 */
export interface MarketingCampaign {
    id: string
    title: string
    content: string
    /**
     * 推送类型
     */
    type: MarketingCampaignType
    /**
     * 推送目标条件
     */
    targetCriteria: MarketingCampaignTargetCriteria
    senderId: string
    sentAt: string | null
    scheduledAt: string | null
    status: MarketingCampaignStatus
    createdAt: string
    updatedAt: string
}

/**
 * 分页数据接口
 */
export interface PaginatedData<T> {
    items: T[]
    total: number
    page: number
    limit: number
}
