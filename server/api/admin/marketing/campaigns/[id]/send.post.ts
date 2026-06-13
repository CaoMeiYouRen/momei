import { z } from 'zod'
import { requireAdmin } from '@/server/utils/permission'
import { startMarketingCampaignDispatch } from '@/server/services/notification'

/** Route params: id — campaign ID (required) */
const paramsSchema = z.object({ id: z.string().min(1) })

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const id = getRouterParam(event, 'id')
    const parsed = paramsSchema.safeParse({ id })

    if (!parsed.success) {
        throw createError({ statusCode: 400, statusMessage: 'Campaign ID is required' })
    }

    const result = await startMarketingCampaignDispatch(parsed.data.id)

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
