import { deletePlacement } from '../../../../services/ad'

/**
 * 删除广告位
 * DELETE /api/admin/ad/placements/:id
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

        const success = await deletePlacement(id)

        if (!success) {
            return {
                code: 404,
                message: 'Ad placement not found',
            }
        }

        return {
            code: 200,
            message: 'Ad placement deleted successfully',
        }
    } catch (error) {
        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Failed to delete ad placement',
        }
    }
})
