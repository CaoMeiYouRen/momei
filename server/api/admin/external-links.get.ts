import { defineEventHandler } from 'h3'
import { getAllLinks } from '@/server/services/link'
import { requireAdmin } from '@/server/utils/permission'

/**
 * 获取外链列表
 * GET /api/admin/external-links
 */
export default defineEventHandler(async (event) => {
    try {
        await requireAdmin(event)

        const links = await getAllLinks()

        return {
            code: 200,
            data: links,
            message: 'Success',
        }
    } catch (error: unknown) {
        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Internal server error',
        }
    }
})
