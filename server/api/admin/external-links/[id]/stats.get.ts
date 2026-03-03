import { defineEventHandler, getRouterParam } from 'h3'
import { getLinkStats } from '@/server/services/link'
import { requireAdmin } from '@/server/utils/permission'

/**
 * 获取外链统计信息
 * GET /api/admin/external-links/:id/stats
 */
export default defineEventHandler(async (event) => {
    try {
        await requireAdmin(event)

        const id = getRouterParam(event, 'id')
        if (!id) {
            return {
                code: 400,
                message: 'Link ID is required',
            }
        }

        const stats = await getLinkStats(id)

        if (!stats) {
            return {
                code: 404,
                message: 'Link not found',
            }
        }

        return {
            code: 200,
            data: stats,
            message: 'Success',
        }
    } catch (error: unknown) {
        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Internal server error',
        }
    }
})
