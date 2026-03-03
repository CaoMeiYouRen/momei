import { updateCampaign } from '../../../../services/ad'
import { CampaignStatus } from '@/types/ad'

/**
 * 更新广告活动
 * PUT /api/admin/ad/campaigns/:id
 */
export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')
        if (!id) {
            return {
                code: 400,
                message: 'Campaign ID is required',
            }
        }

        const body = await readBody(event)

        // 构建更新数据
        const updateData: Record<string, any> = {}

        if (body.name !== undefined) {
            updateData.name = body.name
        }
        if (body.status !== undefined && Object.values(CampaignStatus).includes(body.status)) {
            updateData.status = body.status
        }
        if (body.startDate !== undefined) {
            updateData.startDate = body.startDate
        }
        if (body.endDate !== undefined) {
            updateData.endDate = body.endDate
        }
        if (body.targeting !== undefined) {
            updateData.targeting = body.targeting
        }
        if (body.impressions !== undefined) {
            updateData.impressions = body.impressions
        }
        if (body.clicks !== undefined) {
            updateData.clicks = body.clicks
        }
        if (body.revenue !== undefined) {
            updateData.revenue = body.revenue
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
        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Failed to update ad campaign',
        }
    }
})
