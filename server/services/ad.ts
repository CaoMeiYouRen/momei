import { In } from 'typeorm'
import { adAdapterRegistry } from './adapters'
import { dataSource } from '@/server/database'
import { AdLocation, CampaignStatus } from '@/types/ad'
import { AdPlacement } from '@/server/entities/ad-placement'
import { AdCampaign } from '@/server/entities/ad-campaign'

const MAX_TRACKED_SESSIONS = 10_000
const sessionViewCounts = new Map<string, Map<string, number>>()

function canTrackSessionView(sessionId: string, placementId: string, maxViewsPerSession: number): boolean {
    if (maxViewsPerSession <= 0) {
        return true
    }

    let placementCountMap = sessionViewCounts.get(sessionId)
    if (!placementCountMap) {
        if (sessionViewCounts.size >= MAX_TRACKED_SESSIONS) {
            const oldestKey = sessionViewCounts.keys().next().value
            if (oldestKey !== undefined) {
                sessionViewCounts.delete(oldestKey)
            }
        }
        placementCountMap = new Map<string, number>()
        sessionViewCounts.set(sessionId, placementCountMap)
    }

    const current = placementCountMap.get(placementId) ?? 0
    if (current >= maxViewsPerSession) {
        return false
    }

    placementCountMap.set(placementId, current + 1)
    return true
}

/**
 * 广告服务
 * 提供广告位和广告活动的管理功能
 *
 * @author Claude Code
 * @date 2026-03-03
 */

/**
 * 获取指定位置的广告位
 * @param location 广告位置
 * @param context 上下文信息（用于定向）
 */
export async function getPlacementsByLocation(
    location: AdLocation,
    context?: {
        locale?: string
        categories?: string[]
        tags?: string[]
        sessionId?: string
    },
): Promise<AdPlacement[]> {
    const placementRepo = dataSource.getRepository(AdPlacement)

    const queryBuilder = placementRepo
        .createQueryBuilder('placement')
        .leftJoinAndSelect('placement.campaign', 'campaign')
        .where('placement.location = :location', { location })
        .andWhere('placement.enabled = :enabled', { enabled: true })
        .orderBy('placement.priority', 'DESC')
        .addOrderBy('placement.createdAt', 'ASC')

    const placements = await queryBuilder.getMany()

    // 根据定向规则和适配器支持过滤
    const now = new Date()
    return placements.filter((placement) => {
        // 检查适配器是否支持当前语言环境
        if (context?.locale) {
            const adapter = adAdapterRegistry.get(placement.adapterId)
            if (adapter && !adapter.supportsLocale(context.locale)) {
                return false
            }
        }

        // 检查广告活动是否处于活跃状态
        if (placement.campaign) {
            const campaign = placement.campaign
            if (campaign.status !== CampaignStatus.ACTIVE) {
                return false
            }
            // 检查日期范围
            if (campaign.startDate && campaign.startDate > now) {
                return false
            }
            if (campaign.endDate && campaign.endDate < now) {
                return false
            }
        }

        if (!evaluateTargeting(placement, context)) {
            return false
        }

        const maxViewsPerSession = placement.targeting?.maxViewsPerSession
        if (maxViewsPerSession && maxViewsPerSession > 0) {
            if (!context?.sessionId) {
                return false
            }
            return canTrackSessionView(context.sessionId, placement.id, maxViewsPerSession)
        }

        return true
    })
}

/**
 * 评估广告位定向规则
 * @param placement 广告位
 * @param context 上下文信息
 */
export function evaluateTargeting(
    placement: AdPlacement,
    context?: {
        locale?: string
        categories?: string[]
        tags?: string[]
        sessionId?: string
    },
): boolean {
    const targeting = placement.targeting

    // 如果没有定向规则，默认展示
    if (!targeting) {
        return true
    }

    // 语言定向
    if (targeting.locales && targeting.locales.length > 0) {
        if (!context?.locale || !targeting.locales.includes(context.locale)) {
            return false
        }
    }

    // 分类定向 (OR 逻辑：匹配任一分类即展示)
    if (targeting.categories && targeting.categories.length > 0) {
        if (!context?.categories) {
            return false
        }
        const hasMatch = targeting.categories.some((cat) =>
            context.categories!.includes(cat),
        )
        if (!hasMatch) {
            return false
        }
    }

    // 标签定向 (OR 逻辑：匹配任一标签即展示)
    if (targeting.tags && targeting.tags.length > 0) {
        if (!context?.tags) {
            return false
        }
        const hasMatch = targeting.tags.some((tag) =>
            context.tags!.includes(tag),
        )
        if (!hasMatch) {
            return false
        }
    }

    return true
}

/**
 * 获取所有广告活动
 */
export async function getAllCampaigns(): Promise<AdCampaign[]> {
    const campaignRepo = dataSource.getRepository(AdCampaign)
    return campaignRepo.find({
        relations: ['placements'],
        order: {
            createdAt: 'DESC',
        },
    })
}

/**
 * 根据 ID 获取广告活动
 */
export async function getCampaignById(id: string): Promise<AdCampaign | null> {
    const campaignRepo = dataSource.getRepository(AdCampaign)
    return campaignRepo.findOne({
        where: { id },
        relations: ['placements'],
    })
}

/**
 * 创建广告活动
 */
export async function createCampaign(data: Partial<AdCampaign>): Promise<AdCampaign> {
    const campaignRepo = dataSource.getRepository(AdCampaign)
    const campaign = campaignRepo.create(data)
    return campaignRepo.save(campaign)
}

/**
 * 更新广告活动
 */
export async function updateCampaign(id: string, data: Partial<AdCampaign>): Promise<AdCampaign | null> {
    const campaignRepo = dataSource.getRepository(AdCampaign)
    await campaignRepo.update(id, data)
    return getCampaignById(id)
}

/**
 * 删除广告活动
 */
export async function deleteCampaign(id: string): Promise<boolean> {
    const campaignRepo = dataSource.getRepository(AdCampaign)
    const result = await campaignRepo.delete(id)
    return result.affected ? result.affected > 0 : false
}

/**
 * 获取所有广告位
 */
export async function getAllPlacements(): Promise<AdPlacement[]> {
    const placementRepo = dataSource.getRepository(AdPlacement)
    return placementRepo.find({
        relations: ['campaign'],
        order: {
            priority: 'DESC',
            createdAt: 'ASC',
        },
    })
}

/**
 * 根据 ID 获取广告位
 */
export async function getPlacementById(id: string): Promise<AdPlacement | null> {
    const placementRepo = dataSource.getRepository(AdPlacement)
    return placementRepo.findOne({
        where: { id },
        relations: ['campaign'],
    })
}

/**
 * 创建广告位
 */
export async function createPlacement(data: Partial<AdPlacement>): Promise<AdPlacement> {
    const placementRepo = dataSource.getRepository(AdPlacement)
    const placement = placementRepo.create(data)
    return placementRepo.save(placement)
}

/**
 * 更新广告位
 */
export async function updatePlacement(id: string, data: Partial<AdPlacement>): Promise<AdPlacement | null> {
    const placementRepo = dataSource.getRepository(AdPlacement)
    await placementRepo.update(id, data)
    return getPlacementById(id)
}

/**
 * 删除广告位
 */
export async function deletePlacement(id: string): Promise<boolean> {
    const placementRepo = dataSource.getRepository(AdPlacement)
    const result = await placementRepo.delete(id)
    return result.affected ? result.affected > 0 : false
}

/**
 * 批量更新广告位状态
 */
export async function updatePlacementStatus(ids: string[], enabled: boolean): Promise<void> {
    const placementRepo = dataSource.getRepository(AdPlacement)
    await placementRepo.update({ id: In(ids) }, { enabled })
}

/**
 * 获取广告位的广告代码
 * @param placementId 广告位ID
 * @returns 广告HTML代码，如果广告位不存在或未启用则返回null
 */
export async function getAdForPlacement(placementId: string): Promise<string | null> {
    try {
        const placement = await getPlacementById(placementId)
        if (!placement?.enabled) {
            return null
        }

        const adapter = adAdapterRegistry.get(placement.adapterId)
        if (!adapter) {
            return null
        }

        return adapter.getPlacementHtml(placement)
    } catch {
        return null
    }
}

/**
 * 记录广告展示
 * @param campaignId 广告活动ID
 */
export async function recordImpression(campaignId: string): Promise<void> {
    try {
        const campaignRepo = dataSource.getRepository(AdCampaign)
        await campaignRepo.increment({ id: campaignId }, 'impressions', 1)
    } catch {
        // Silently fail - don't throw errors for tracking
    }
}

/**
 * 记录广告点击
 * @param campaignId 广告活动ID
 * @param revenue 可选的收入金额
 */
export async function recordClick(campaignId: string, revenue?: number): Promise<void> {
    try {
        const campaignRepo = dataSource.getRepository(AdCampaign)
        const campaign = await campaignRepo.findOne({ where: { id: campaignId } })

        if (campaign) {
            campaign.clicks = (campaign.clicks || 0) + 1
            if (revenue !== undefined) {
                campaign.revenue = (campaign.revenue || 0) + revenue
            }
            await campaignRepo.save(campaign)
        }
    } catch {
        // Silently fail - don't throw errors for tracking
    }
}
