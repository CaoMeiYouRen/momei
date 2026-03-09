import { getSetting } from '@/server/services/setting'
import {
    calculateDisplayCost,
    DEFAULT_AI_COST_FACTORS,
    normalizeAICostFactors,
} from '@/server/utils/ai/cost-governance'
import { parseMaybeJson } from '@/utils/shared/coerce'
import { aiCostFactorsSchema } from '@/utils/schemas/ai'
import { SettingKey } from '@/types/setting'
import type { AICostFactors, AIUsageSnapshot } from '@/types/ai'

export async function getAICostFactors(): Promise<AICostFactors> {
    const rawValue = await getSetting(SettingKey.AI_COST_FACTORS, JSON.stringify(DEFAULT_AI_COST_FACTORS))
    const parsedValue = parseMaybeJson<Record<string, unknown> | null>(String(rawValue || ''), null)
    const validation = aiCostFactorsSchema.safeParse(parsedValue)

    if (!validation.success) {
        return DEFAULT_AI_COST_FACTORS
    }

    return normalizeAICostFactors(validation.data)
}

export async function getAICostDisplayConfig() {
    const factors = await getAICostFactors()

    return {
        currencyCode: factors.currencyCode,
        currencySymbol: factors.currencySymbol,
        quotaUnitPrice: factors.quotaUnitPrice,
    }
}

export async function estimateAIDisplayCost(options: {
    category?: string | null
    type?: string | null
    usageSnapshot?: AIUsageSnapshot | null
    payload?: unknown
    quotaUnits?: number | null
    provider?: string | null
    providerCost?: number | null
    providerCurrency?: string | null
}) {
    const factors = await getAICostFactors()

    return calculateDisplayCost({
        ...options,
        factors,
    })
}
