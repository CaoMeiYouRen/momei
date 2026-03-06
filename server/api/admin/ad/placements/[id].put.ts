import { z } from 'zod'
import { updatePlacement } from '../../../../services/ad'
import { AdFormat, AdLocation } from '@/types/ad'
import { requireAdmin } from '@/server/utils/permission'

const updatePlacementSchema = z.object({
    name: z.string().trim().min(1).optional(),
    format: z.enum(AdFormat).optional(),
    location: z.enum(AdLocation).optional(),
    adapterId: z.string().trim().min(1).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    enabled: z.boolean().optional(),
    targeting: z.record(z.string(), z.unknown()).optional(),
    priority: z.number().int().min(0).optional(),
    customCss: z.string().nullable().optional(),
    campaignId: z.string().nullable().optional(),
})

/**
 * 更新广告位
 * PUT /api/admin/ad/placements/:id
 */
export default defineEventHandler(async (event) => {
    try {
        await requireAdmin(event)

        const id = getRouterParam(event, 'id')
        if (!id) {
            return {
                code: 400,
                message: 'Ad placement ID is required',
            }
        }

        const updateData = await readValidatedBody(event, (payload) => updatePlacementSchema.parse(payload))

        const placement = await updatePlacement(id, updateData)

        if (!placement) {
            return {
                code: 404,
                message: 'Ad placement not found',
            }
        }

        return {
            code: 200,
            data: placement,
            message: 'Ad placement updated successfully',
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
            message: error instanceof Error ? error.message : 'Failed to update ad placement',
        }
    }
})
