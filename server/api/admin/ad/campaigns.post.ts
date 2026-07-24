import { z } from 'zod'
import { createCampaign } from '../../../services/ad'
import { CampaignStatus } from '@/types/ad'
import { requireAdmin } from '@/server/utils/permission'
import { createCampaignSchema } from '@/utils/schemas/ad'
import { toDateOrNull } from '@/server/utils/date'

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
