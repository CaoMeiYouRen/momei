import { z } from 'zod'
import { createPlacement } from '../../../services/ad'
import { requireAdmin } from '@/server/utils/permission'
import { createPlacementSchema } from '@/utils/schemas/ad'

/**
 * 创建广告位
 * POST /api/admin/ad/placements
 */
export default defineEventHandler(async (event) => {
    try {
        await requireAdmin(event)
        const body = await readValidatedBody(event, (payload) => createPlacementSchema.parse(payload))

        const placement = await createPlacement({
            name: body.name,
            format: body.format,
            location: body.location,
            adapterId: body.adapterId,
            metadata: body.metadata || {},
            enabled: body.enabled !== undefined ? body.enabled : true,
            targeting: body.targeting || {},
            priority: body.priority || 0,
            customCss: body.customCss || null,
            campaignId: body.campaignId || null,
        })

        return {
            code: 201,
            data: placement,
            message: 'Ad placement created successfully',
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                code: 400,
                message: error.issues[0]?.message || 'Invalid request body',
            }
        }

        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Failed to create ad placement',
        }
    }
})
