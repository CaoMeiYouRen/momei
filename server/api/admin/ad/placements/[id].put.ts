import { z } from 'zod'
import { updatePlacement } from '../../../../services/ad'
import { requireAdmin } from '@/server/utils/permission'
import { updatePlacementSchema } from '@/utils/schemas/ad'

/**
 * 更新广告位
 * PUT /api/admin/ad/placements/:id
 */
export default defineEventHandler(async (event) => {
    try {
        await requireAdmin(event)

        const id = getRouterParam(event, 'id')
        if (!id) {
            return {
                code: 400,
                message: 'Ad placement ID is required',
            }
        }

        const updateData = await readValidatedBody(event, (payload) => updatePlacementSchema.parse(payload))

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
        if (error instanceof z.ZodError) {
            return {
                code: 400,
                message: error.issues[0]?.message || 'Invalid request body',
            }
        }

        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Failed to update ad placement',
        }
    }
})
