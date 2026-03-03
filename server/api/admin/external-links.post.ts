import { defineEventHandler, readBody } from 'h3'
import { createLink } from '@/server/services/link'

/**
 * 创建外链
 * POST /api/admin/external-links
 */
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)

        // 验证必填字段
        if (!body.originalUrl) {
            return {
                code: 400,
                message: 'Original URL is required',
            }
        }

        if (!body.createdById) {
            return {
                code: 400,
                message: 'User ID is required',
            }
        }

        const link = await createLink({
            originalUrl: body.originalUrl,
            createdById: body.createdById,
            noFollow: body.noFollow ?? false,
            showRedirectPage: body.showRedirectPage ?? true,
            metadata: body.metadata,
        })

        return {
            code: 201,
            data: link,
            message: 'Link created successfully',
        }
    } catch (error: any) {
        return {
            code: 500,
            message: error.message || 'Internal server error',
        }
    }
})
