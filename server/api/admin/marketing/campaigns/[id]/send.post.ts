import { requireAdmin } from '@/server/utils/permission'
import { startMarketingCampaignDispatch } from '@/server/services/notification'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Campaign ID is required' })
    }

    const result = await startMarketingCampaignDispatch(id)

    if (result.state === 'not_found') {
        throw createError({ statusCode: 404, statusMessage: 'Campaign not found' })
    }

    if (result.state === 'already_completed') {
        throw createError({ statusCode: 400, statusMessage: 'Campaign already sent' })
    }

    if (result.state === 'already_sending') {
        throw createError({ statusCode: 400, statusMessage: 'Campaign is already sending' })
    }

    return {
        code: 200,
        message: 'Campaign sending started',
    }
})
