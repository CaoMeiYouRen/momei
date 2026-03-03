import { updatePlacement } from '../../../../services/ad'
import { AdFormat, AdLocation } from '@/types/ad'

/**
 * 更新广告位
 * PUT /api/admin/ad/placements/:id
 */
export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')
        if (!id) {
            return {
                code: 400,
                message: 'Ad placement ID is required',
            }
        }

        const body = await readBody(event)

        // 构建更新数据
        const updateData: Record<string, any> = {}

        if (body.name !== undefined) {
            updateData.name = body.name
        }
        if (body.format !== undefined && Object.values(AdFormat).includes(body.format)) {
            updateData.format = body.format
        }
        if (body.location !== undefined && Object.values(AdLocation).includes(body.location)) {
            updateData.location = body.location
        }
        if (body.adapterId !== undefined) {
            updateData.adapterId = body.adapterId
        }
        if (body.metadata !== undefined) {
            updateData.metadata = body.metadata
        }
        if (body.enabled !== undefined) {
            updateData.enabled = body.enabled
        }
        if (body.targeting !== undefined) {
            updateData.targeting = body.targeting
        }
        if (body.priority !== undefined) {
            updateData.priority = body.priority
        }
        if (body.customCss !== undefined) {
            updateData.customCss = body.customCss
        }
        if (body.campaignId !== undefined) {
            updateData.campaignId = body.campaignId
        }

        const placement = await updatePlacement(id, updateData)

        if (!placement) {
            return {
                code: 404,
                message: 'Ad placement not found',
            }
        }

        return {
            code: 200,
            data: placement,
            message: 'Ad placement updated successfully',
        }
    } catch (error) {
        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Failed to update ad placement',
        }
    }
})
