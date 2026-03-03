import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { updateLink, updateLinkStatus } from '@/server/services/link'
import { LinkStatus } from '@/types/ad'

/**
 * 更新外链
 * PUT /api/admin/external-links/:id
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

        const body = await readBody(event)

        // 如果是状态更新，使用专用方法
        if (body.status !== undefined) {
            const link = await updateLinkStatus(id, body.status as LinkStatus)
            if (!link) {
                return {
                    code: 404,
                    message: 'Link not found',
                }
            }
            return {
                code: 200,
                data: link,
                message: 'Link status updated successfully',
            }
        }

        // 其他字段更新
        const link = await updateLink(id, body)
        if (!link) {
            return {
                code: 404,
                message: 'Link not found',
            }
        }

        return {
            code: 200,
            data: link,
            message: 'Link updated successfully',
        }
    } catch (error: any) {
        return {
            code: 500,
            message: error.message || 'Internal server error',
        }
    }
})
