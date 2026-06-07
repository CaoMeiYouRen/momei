import { z } from 'zod'
import { createCampaignFromPost, startMarketingCampaignDispatch } from '@/server/services/notification'
import { requireAdmin } from '@/server/utils/permission'
import { MarketingCampaignStatus } from '@/utils/shared/notification'

const repushOptionsSchema = z.object({
    pushOption: z.enum(['none', 'draft', 'now']).optional().default('now'),
    pushCriteria: z.object({
        categoryIds: z.array(z.string()).optional(),
        tagIds: z.array(z.string()).optional(),
    }).optional(),
    publishedAt: z.coerce.date().nullable().optional(),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdmin(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Post ID is required',
        })
    }

    const result = await readValidatedBody(event, (body) => repushOptionsSchema.safeParse(body || {}))
    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }
    const { pushOption, pushCriteria, publishedAt } = result.data

    if (pushOption === 'none') {
        return {
            code: 200,
            message: 'Repush skipped',
        }
    }

    const isScheduled = pushOption === 'now'
        && publishedAt instanceof Date
        && publishedAt.getTime() > Date.now()
    let campaignStatus = MarketingCampaignStatus.SENDING
    if (pushOption === 'draft') {
        campaignStatus = MarketingCampaignStatus.DRAFT
    } else if (isScheduled) {
        campaignStatus = MarketingCampaignStatus.SCHEDULED
    }

    const campaign = await createCampaignFromPost(
        id,
        session.user.id,
        campaignStatus,
        pushCriteria,
        isScheduled ? publishedAt : null,
    )

    if (campaignStatus === MarketingCampaignStatus.SENDING) {
        void startMarketingCampaignDispatch(campaign.id).catch((err) => {
            console.error('Failed to send repushed marketing campaign:', err)
        })
    }

    let message = 'Repush task started'
    if (campaignStatus === MarketingCampaignStatus.DRAFT) {
        message = 'Repush draft created'
    } else if (campaignStatus === MarketingCampaignStatus.SCHEDULED) {
        message = 'Repush campaign scheduled'
    }

    return {
        code: 200,
        message,
    }
})
