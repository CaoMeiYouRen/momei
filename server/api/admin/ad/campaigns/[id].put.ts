import { z } from 'zod'
import { updateCampaign } from '../../../../services/ad'
import { CampaignStatus } from '@/types/ad'
import { requireAdmin } from '@/server/utils/permission'

const updateCampaignSchema = z.object({
    name: z.string().trim().min(1).optional(),
    status: z.enum(CampaignStatus).optional(),
    startDate: z.union([z.string(), z.date()]).nullable().optional(),
    endDate: z.union([z.string(), z.date()]).nullable().optional(),
    targeting: z.record(z.string(), z.unknown()).optional(),
    impressions: z.number().int().min(0).optional(),
    clicks: z.number().int().min(0).optional(),
    revenue: z.number().min(0).optional(),
})

function toDateOrNull(value?: string | Date | null): Date | null | undefined {
    if (value === undefined) {
        return undefined
    }

    if (value === null || value === '') {
        return null
    }

    if (value instanceof Date) {
        return value
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

/**
 * 更新广告活动
 * PUT /api/admin/ad/campaigns/:id
 */
export default defineEventHandler(async (event) => {
    try {
        await requireAdmin(event)

        const id = getRouterParam(event, 'id')
        if (!id) {
            return {
                code: 400,
                message: 'Campaign ID is required',
            }
        }

        const body = await readValidatedBody(event, (payload) => updateCampaignSchema.parse(payload))
        const updateData = {
            ...body,
            startDate: toDateOrNull(body.startDate),
            endDate: toDateOrNull(body.endDate),
        }

        const campaign = await updateCampaign(id, updateData)

        if (!campaign) {
            return {
                code: 404,
                message: 'Ad campaign not found',
            }
        }

        return {
            code: 200,
            data: campaign,
            message: 'Ad campaign updated successfully',
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
            message: error instanceof Error ? error.message : 'Failed to update ad campaign',
        }
    }
})
