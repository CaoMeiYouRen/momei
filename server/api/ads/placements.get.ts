import { randomUUID } from 'node:crypto'
import { getPlacementsByLocation } from '../../services/ad'
import { AdLocation } from '@/types/ad'
import { toQueryString, toQueryStringArray } from '@/server/utils/query-params'

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

        const location = toQueryString(query.location)
        if (!location || !Object.values(AdLocation).includes(location as AdLocation)) {
            return {
                code: 400,
                message: 'Invalid or missing location parameter',
            }
        }

        const context: {
            locale?: string
            categories?: string[]
            tags?: string[]
            sessionId?: string
        } = {}

        let sessionId = getCookie(event, 'momei_ad_session_id')
        if (!sessionId) {
            sessionId = randomUUID()
            setCookie(event, 'momei_ad_session_id', sessionId, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24,
            })
        }
        context.sessionId = sessionId

        const locale = toQueryString(query.locale)
        if (locale) {
            context.locale = locale
        }

        const categories = toQueryStringArray(query.categories)
        if (categories) {
            context.categories = categories
        }

        const tags = toQueryStringArray(query.tags)
        if (tags) {
            context.tags = tags
        }

        const placements = await getPlacementsByLocation(location as AdLocation, context)

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
