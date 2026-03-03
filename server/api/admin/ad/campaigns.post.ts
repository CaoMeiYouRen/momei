import { z } from 'zod'
import { createCampaign } from '../../../services/ad'
import { CampaignStatus } from '@/types/ad'
import { requireAdmin } from '@/server/utils/permission'

const createCampaignSchema = z.object({
    name: z.string().trim().min(1),
    status: z.enum(CampaignStatus).optional(),
    startDate: z.union([z.string(), z.date()]).nullable().optional(),
    endDate: z.union([z.string(), z.date()]).nullable().optional(),
    targeting: z.record(z.string(), z.unknown()).optional().default({}),
})

function toDateOrNull(value?: string | Date | null): Date | null {
    if (!value) {
        return null
    }

    if (value instanceof Date) {
        return value
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

/**
 * 创建广告活动
 * POST /api/admin/ad/campaigns
 */
export default defineEventHandler(async (event) => {
    try {
        await requireAdmin(event)
        const body = await readValidatedBody(event, (payload) => createCampaignSchema.parse(payload))

        const campaign = await createCampaign({
            name: body.name,
            status: body.status || CampaignStatus.DRAFT,
            startDate: toDateOrNull(body.startDate),
            endDate: toDateOrNull(body.endDate),
            targeting: body.targeting || {},
            impressions: 0,
            clicks: 0,
            revenue: 0,
        })

        return {
            code: 201,
            data: campaign,
            message: 'Ad campaign created successfully',
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
            message: error instanceof Error ? error.message : 'Failed to create ad campaign',
        }
    }
})
