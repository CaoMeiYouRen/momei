import { TTSService } from '@/server/services/ai'
import { calculateQuotaUnits } from '@/server/utils/ai/cost-governance'
import { success } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    await requireAdminOrAuthor(event)

    const body = await readBody(event)
    const { voice, text, provider, mode = 'speech' } = body

    if (!voice || !text) {
        throw createError({ statusCode: 400, message: 'Voice and text are required' })
    }

    const category = mode === 'podcast' ? 'podcast' : 'tts'
    const quotaUnits = calculateQuotaUnits({
        category,
        type: category,
        payload: { text, voice, mode },
    })
    const estimate = await TTSService.estimateCostBreakdown(text, voice as string, provider as string, { mode, quotaUnits })

    return success({
        providerCost: estimate.providerCost,
        providerCurrency: estimate.providerCurrency,
        displayCost: estimate.displayCost,
        quotaUnits,
        costDisplay: estimate.costDisplay,
    })
})
