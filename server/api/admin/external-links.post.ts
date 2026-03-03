import { defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { createLink } from '@/server/services/link'
import { requireAdmin } from '@/server/utils/permission'

const createExternalLinkSchema = z.object({
    originalUrl: z.string().trim().min(1),
    noFollow: z.boolean().optional(),
    showRedirectPage: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * 创建外链
 * POST /api/admin/external-links
 */
export default defineEventHandler(async (event) => {
    try {
        const session = await requireAdmin(event)
        const rawBody = await readBody(event)
        const body = createExternalLinkSchema.parse(rawBody)

        const link = await createLink({
            originalUrl: body.originalUrl,
            createdById: session.user.id,
            noFollow: body.noFollow ?? false,
            showRedirectPage: body.showRedirectPage ?? true,
            metadata: body.metadata,
        })

        return {
            code: 201,
            data: link,
            message: 'Link created successfully',
        }
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return {
                code: 400,
                message: error.issues[0]?.message || 'Invalid request body',
            }
        }

        if (error instanceof Error && (error.message === 'Invalid URL' || error.message === 'URL is blacklisted')) {
            return {
                code: 400,
                message: error.message,
            }
        }

        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Internal server error',
        }
    }
})
