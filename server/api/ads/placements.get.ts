import { getPlacementsByLocation } from '../../services/ad'
import { AdLocation } from '@/types/ad'

/**
 * 获取广告位配置（公开接口）
 * GET /api/ads/placements
 *
 * 查询参数:
 * - location: 广告位置 (header, sidebar, content_top, content_middle, content_bottom, footer)
 * - locale: 语言环境 (可选)
 * - categories: 分类 ID 数列 (可选)
 * - tags: 标签 ID 数列 (可选)
 */
export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)

        const location = query.location as AdLocation
        if (!location || !Object.values(AdLocation).includes(location)) {
            return {
                code: 400,
                message: 'Invalid or missing location parameter',
            }
        }

        const context: {
            locale?: string
            categories?: string[]
            tags?: string[]
        } = {}

        if (query.locale) {
            context.locale = query.locale as string
        }

        if (query.categories) {
            context.categories = Array.isArray(query.categories)
                ? query.categories as string[]
                : [query.categories as string]
        }

        if (query.tags) {
            context.tags = Array.isArray(query.tags)
                ? query.tags as string[]
                : [query.tags as string]
        }

        const placements = await getPlacementsByLocation(location, context)

        // 只返回必要的字段
        const safePlacements = placements.map((placement) => ({
            id: placement.id,
            name: placement.name,
            location: placement.location,
            format: placement.format,
            adapterId: placement.adapterId,
            metadata: placement.metadata,
            customCss: placement.customCss,
        }))

        return {
            code: 200,
            data: safePlacements,
            message: 'Success',
        }
    } catch (error) {
        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Failed to fetch ad placements',
        }
    }
})
