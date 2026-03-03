import { getAllCampaigns } from '../../../services/ad'

/**
 * 获取所有广告活动
 * GET /api/admin/ad/campaigns
 */
export default defineEventHandler(async () => {
    try {
        const campaigns = await getAllCampaigns()

        return {
            code: 200,
            data: campaigns,
            message: 'Success',
        }
    } catch (error) {
        return {
            code: 500,
            message: error instanceof Error ? error.message : 'Failed to fetch ad campaigns',
        }
    }
})
