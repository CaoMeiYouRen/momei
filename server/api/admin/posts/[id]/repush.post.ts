import { requireAdmin } from '@/server/utils/permission'
import { createCampaignFromPost, sendMarketingCampaign } from '@/server/services/notification'
import { MarketingCampaignStatus } from '@/utils/shared/notification'

export default defineEventHandler(async (event) => {
    const session = await requireAdmin(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Post ID is required',
        })
    }

    // Manual repush always creates a new campaign and starts sending immediately (as per current design)
    // or we could make it configurable. For now, immediate send is simpler.
    const campaign = await createCampaignFromPost(id, session.user.id, MarketingCampaignStatus.SENDING)

    // Background send
    sendMarketingCampaign(campaign.id).catch((err) => {
        console.error('Failed to send repushed marketing campaign:', err)
    })

    return {
        code: 200,
        message: 'Repush task started',
    }
})
