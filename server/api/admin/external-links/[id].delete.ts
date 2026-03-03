import { defineEventHandler, getRouterParam } from 'h3'
import { deleteLink } from '@/server/services/link'

/**
 * 删除外链
 * DELETE /api/admin/external-links/:id
 */
export default defineEventHandler(async (event) => {
    try {
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
    } catch (error: any) {
        return {
            code: 500,
            message: error.message || 'Internal server error',
        }
    }
})
