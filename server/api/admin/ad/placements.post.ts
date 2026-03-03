import { createPlacement } from '../../../services/ad'
import { AdFormat, AdLocation } from '@/types/ad'

/**
 * 创建广告位
 * POST /api/admin/ad/placements
 */
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)

        // 验证必填字段
        if (!body.name) {
            return {
                code: 400,
                message: 'Ad placement name is required',
            }
        }

        if (!body.format || !Object.values(AdFormat).includes(body.format)) {
            return {
                code: 400,
                message: 'Invalid ad format',
            }
        }

        if (!body.location || !Object.values(AdLocation).includes(body.location)) {
            return {
                code: 400,
                message: 'Invalid ad location',
            }
        }

        if (!body.adapterId) {
            return {
                code: 400,
                message: 'Adapter ID is required',
            }
        }

        const placement = await createPlacement({
            name: body.name,
            format: body.format,
            location: body.location,
            adapterId: body.adapterId,
            metadata: body.metadata || {},
            enabled: body.enabled !== undefined ? body.enabled : true,
            targeting: body.targeting || {},
            priority: body.priority || 0,
            customCss: body.customCss || null,
            campaignId: body.campaignId || null,
        })

        return {
            code: 201,
            data: placement,
            message: 'Ad placement created successfully',
        }
    } catch (error) {
        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Failed to create ad placement',
        }
    }
})
