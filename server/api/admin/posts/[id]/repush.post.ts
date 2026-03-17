import { requireAdmin } from '@/server/utils/permission'
import { createCampaignFromPost, startMarketingCampaignDispatch } from '@/server/services/notification'

export default defineEventHandler(async (event) => {
    const session = await requireAdmin(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Post ID is required',
        })
    }

    const campaign = await createCampaignFromPost(id, session.user.id)

    void startMarketingCampaignDispatch(campaign.id).catch((err) => {
        console.error('Failed to send repushed marketing campaign:', err)
    })

    return {
        code: 200,
        message: 'Repush task started',
    }
})
