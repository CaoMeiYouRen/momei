import type { AICostDisplay } from '@/types/ai'
import { formatCurrency } from '@/utils/shared/number'

export const DEFAULT_AI_COST_DISPLAY: AICostDisplay = {
    currencyCode: 'CNY',
    currencySymbol: '¥',
    quotaUnitPrice: 0,
}

export function normalizeAICostDisplay(raw?: Partial<AICostDisplay> | null): AICostDisplay {
    const currencyCode = String(raw?.currencyCode || DEFAULT_AI_COST_DISPLAY.currencyCode).trim().toUpperCase() || DEFAULT_AI_COST_DISPLAY.currencyCode
    const currencySymbol = String(raw?.currencySymbol || DEFAULT_AI_COST_DISPLAY.currencySymbol).trim() || DEFAULT_AI_COST_DISPLAY.currencySymbol

    return {
        currencyCode,
        currencySymbol,
        quotaUnitPrice: Number.isFinite(raw?.quotaUnitPrice) ? Number(raw?.quotaUnitPrice) : DEFAULT_AI_COST_DISPLAY.quotaUnitPrice,
    }
}

export function formatAICost(value: unknown, costDisplay?: Partial<AICostDisplay> | null, digits: number = 2) {
    const normalizedDisplay = normalizeAICostDisplay(costDisplay)
    return formatCurrency(value, digits, normalizedDisplay.currencySymbol)
}
