import { defineEventHandler, getQuery } from 'h3'
import { getAllLinks } from '@/server/services/link'

/**
 * 获取外链列表
 * GET /api/admin/external-links
 */
export default defineEventHandler(async (event) => {
    try {
        const links = await getAllLinks()

        return {
            code: 200,
            data: links,
            message: 'Success',
        }
    } catch (error: any) {
        return {
            code: 500,
            message: error.message || 'Internal server error',
        }
    }
})
