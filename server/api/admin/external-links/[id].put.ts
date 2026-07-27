import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { z } from 'zod'
import { updateLink, updateLinkStatus } from '@/server/services/link'
import { LinkStatus } from '@/types/ad'
import { requireAdmin } from '@/server/utils/permission'
import { handleExternalLinkError } from '@/server/utils/external-links-shared'

const updateExternalLinkSchema = z.object({
    originalUrl: z.string().trim().min(1).optional(),
    status: z.enum(LinkStatus).optional(),
    noFollow: z.boolean().optional(),
    showRedirectPage: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * 更新外链
 * PUT /api/admin/external-links/:id
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

        const rawBody = await readBody(event)
        const body = updateExternalLinkSchema.parse(rawBody)

        // 如果是状态更新，使用专用方法
        if (body.status !== undefined) {
            const link = await updateLinkStatus(id, body.status)
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
        const link = await updateLink(id, {
            originalUrl: body.originalUrl,
            noFollow: body.noFollow,
            showRedirectPage: body.showRedirectPage,
            metadata: body.metadata,
        })
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
    } catch (error: unknown) {
        return handleExternalLinkError(error, 'Internal server error')
    }
})
