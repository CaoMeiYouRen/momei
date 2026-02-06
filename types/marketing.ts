import type { MarketingCampaignStatus } from '@/utils/shared/notification'

/**
 * 营销推送记录
 */
export interface MarketingCampaign {
    id: string
    title: string
    content: string
    /**
     * 推送目标条件
     */
    targetCriteria: {
        categoryIds?: string[]
        tagIds?: string[]
    }
    senderId: string
    sentAt: string | null
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
