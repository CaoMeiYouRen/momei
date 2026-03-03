import { createCampaign } from '../../../services/ad'
import { CampaignStatus } from '@/types/ad'

/**
 * 创建广告活动
 * POST /api/admin/ad/campaigns
 */
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)

        // 验证必填字段
        if (!body.name) {
            return {
                code: 400,
                message: 'Campaign name is required',
            }
        }

        const campaign = await createCampaign({
            name: body.name,
            status: body.status || CampaignStatus.DRAFT,
            startDate: body.startDate || null,
            endDate: body.endDate || null,
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
        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Failed to create ad campaign',
        }
    }
})
