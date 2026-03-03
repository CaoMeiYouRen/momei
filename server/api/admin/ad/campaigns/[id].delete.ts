import { deleteCampaign } from '../../../../services/ad'

/**
 * 删除广告活动
 * DELETE /api/admin/ad/campaigns/:id
 */
export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')
        if (!id) {
            return {
                code: 400,
                message: 'Campaign ID is required',
            }
        }

        const success = await deleteCampaign(id)

        if (!success) {
            return {
                code: 404,
                message: 'Ad campaign not found',
            }
        }

        return {
            code: 200,
            message: 'Ad campaign deleted successfully',
        }
    } catch (error) {
        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Failed to delete ad campaign',
        }
    }
})
