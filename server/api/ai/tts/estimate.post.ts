import { z } from 'zod'
import { TTSService } from '@/server/services/ai'
import { calculateQuotaUnits } from '@/server/utils/ai/cost-governance'
import { success } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'

const estimateBodySchema = z.object({
    voice: z.string().min(1),
    text: z.string().min(1),
    provider: z.string().max(50).optional(),
    mode: z.enum(['speech', 'podcast']).optional().default('speech'),
})

export default defineEventHandler(async (event) => {
    await requireAdminOrAuthor(event)

    const { voice, text, provider, mode } = await readValidatedBody(event, (payload) => estimateBodySchema.parse(payload))

    const category = mode === 'podcast' ? 'podcast' : 'tts'
    const quotaUnits = calculateQuotaUnits({
        category,
        type: category,
        payload: { text, voice, mode },
    })
    const estimate = await TTSService.estimateCostBreakdown(text, voice, provider, { mode, quotaUnits })

    return success({
        providerCost: estimate.providerCost,
        providerCurrency: estimate.providerCurrency,
        displayCost: estimate.displayCost,
        quotaUnits,
        costDisplay: estimate.costDisplay,
    })
})
