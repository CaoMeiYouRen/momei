import { defineEventHandler, getRouterParam } from 'h3'
import { deleteLink } from '@/server/services/link'
import { requireAdmin } from '@/server/utils/permission'

/**
 * 删除外链
 * DELETE /api/admin/external-links/:id
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

        const success = await deleteLink(id)

        if (!success) {
            return {
                code: 404,
                message: 'Link not found',
            }
        }

        return {
            code: 200,
            message: 'Link deleted successfully',
        }
    } catch (error: unknown) {
        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Internal server error',
        }
    }
})
