import { getAllPlacements } from '../../../services/ad'
import { requireAdmin } from '@/server/utils/permission'

/**
 * 获取所有广告位
 * GET /api/admin/ad/placements
 */
export default defineEventHandler(async (event) => {
    try {
        await requireAdmin(event)

        const placements = await getAllPlacements()

        return {
            code: 200,
            data: placements,
            message: 'Success',
        }
    } catch (error) {
        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Failed to fetch ad placements',
        }
    }
})
