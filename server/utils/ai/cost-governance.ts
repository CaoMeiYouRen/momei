import type { AICategory, AIChargeStatus, AICostFactors, AIFailureStage, AIUsageSnapshot } from '@/types/ai'
import { parseMaybeJson, toNumber } from '@/utils/shared/coerce'
import { roundTo } from '@/utils/shared/number'

type GovernanceCategory = Exclude<AICategory, 'video'>

interface NormalizeUsageOptions {
    category?: string | null
    type?: string
    payload?: unknown
    response?: unknown
    audioDuration?: number
    audioSize?: number
    textLength?: number
}

interface ChargeStatusOptions {
    status?: string
    failureStage?: AIFailureStage | null
    quotaUnits?: number
    settlementSource?: Exclude<AIChargeStatus, 'none' | 'waived'>
}

const CATEGORY_WEIGHTS: Record<GovernanceCategory, number> = {
    text: 1,
    image: 10,
    asr: 4,
    tts: 3,
    podcast: 6,
}

export const DEFAULT_AI_COST_FACTORS: AICostFactors = {
    currencyCode: 'CNY',
    currencySymbol: '¥',
    quotaUnitPrice: 0.1,
    exchangeRates: {
        CNY: 1,
        USD: 7.2,
    },
    providerCurrencies: {
        openai: 'USD',
        anthropic: 'USD',
        gemini: 'USD',
        groq: 'USD',
        siliconflow: 'CNY',
        volcengine: 'CNY',
        doubao: 'CNY',
        deepseek: 'CNY',
    },
}

function normalizeCurrencyCode(currency: string | null | undefined, fallback: string) {
    const normalized = String(currency || '').trim().toUpperCase()
    return normalized || fallback
}

export function normalizeAICostFactors(rawFactors?: Partial<AICostFactors> | null): AICostFactors {
    const currencyCode = normalizeCurrencyCode(rawFactors?.currencyCode, DEFAULT_AI_COST_FACTORS.currencyCode)
    const exchangeRates = {
        ...DEFAULT_AI_COST_FACTORS.exchangeRates,
        ...(rawFactors?.exchangeRates || {}),
    }
    const normalizedExchangeRates = Object.fromEntries(
        Object.entries(exchangeRates)
            .map(([currency, rate]) => [normalizeCurrencyCode(currency, currencyCode), toNumber(rate, Number.NaN)] as const)
            .filter((entry): entry is readonly [string, number] => Number.isFinite(entry[1]) && entry[1] > 0),
    ) as Record<string, number>

    normalizedExchangeRates[currencyCode] = 1

    return {
        currencyCode,
        currencySymbol: String(rawFactors?.currencySymbol || DEFAULT_AI_COST_FACTORS.currencySymbol).trim() || DEFAULT_AI_COST_FACTORS.currencySymbol,
        quotaUnitPrice: Math.max(0, toNumber(rawFactors?.quotaUnitPrice, DEFAULT_AI_COST_FACTORS.quotaUnitPrice)),
        exchangeRates: normalizedExchangeRates,
        providerCurrencies: Object.fromEntries(
            Object.entries({
                ...DEFAULT_AI_COST_FACTORS.providerCurrencies,
                ...(rawFactors?.providerCurrencies || {}),
            }).map(([provider, currency]) => [provider, normalizeCurrencyCode(currency, currencyCode)]),
        ),
    }
}

export function resolveProviderCostCurrency(provider: string | null | undefined, factors: AICostFactors = DEFAULT_AI_COST_FACTORS) {
    if (!provider) {
        return factors.currencyCode
    }

    return normalizeCurrencyCode(factors.providerCurrencies[provider] || factors.currencyCode, factors.currencyCode)
}

export function convertCostToDisplayCurrency(amount: number, sourceCurrency: string | null | undefined, factors: AICostFactors = DEFAULT_AI_COST_FACTORS) {
    const normalizedAmount = toNumber(amount, 0)
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        return 0
    }

    const normalizedSourceCurrency = normalizeCurrencyCode(sourceCurrency, factors.currencyCode)
    const rate = toNumber(factors.exchangeRates[normalizedSourceCurrency], Number.NaN)

    if (!Number.isFinite(rate) || rate <= 0) {
        return normalizedSourceCurrency === factors.currencyCode ? roundTo(normalizedAmount, 4) : 0
    }

    return roundTo(normalizedAmount * rate, 4)
}

function getPayloadTextLength(payload: Record<string, unknown>) {
    const directText = [payload.text, payload.script, payload.content, payload.sectionContent, payload.title, payload.name]
        .filter((item): item is string => typeof item === 'string')
        .join('\n')

    if (directText) {
        return directText.length
    }

    if (Array.isArray(payload.snippets)) {
        return payload.snippets.join('\n').length
    }

    if (typeof payload.inputSource === 'string') {
        return payload.inputSource.length
    }

    return 0
}

function getImageResolution(payload: Record<string, unknown>, response: Record<string, unknown>) {
    if (typeof payload.size === 'string') {
        return payload.size
    }
    if (typeof response.imageResolution === 'string') {
        return response.imageResolution
    }
    return undefined
}

export function normalizeTaskCategory(category?: string | null, type?: string | null): GovernanceCategory {
    if (category === 'podcast' || type === 'podcast') {
        return 'podcast'
    }
    if (category === 'image' || type === 'image_generation') {
        return 'image'
    }
    if (category === 'asr' || type === 'transcription' || type === 'async_transcription') {
        return 'asr'
    }
    if (category === 'tts' || type === 'tts') {
        return 'tts'
    }
    return 'text'
}

export function normalizeUsageSnapshot(options: NormalizeUsageOptions): AIUsageSnapshot {
    const payload = parseMaybeJson<Record<string, unknown>>(options.payload)
    const response = parseMaybeJson<Record<string, unknown>>(options.response)
    const usage = parseMaybeJson<Record<string, unknown>>(response.usage)
    const normalizedCategory = normalizeTaskCategory(options.category, options.type)

    const snapshot: AIUsageSnapshot = {
        requestCount: 1,
    }

    const promptTokens = toNumber(usage.promptTokens, Number.NaN)
    const completionTokens = toNumber(usage.completionTokens, Number.NaN)
    const totalTokens = toNumber(usage.totalTokens, Number.NaN)
    if (Number.isFinite(promptTokens)) {
        snapshot.promptTokens = promptTokens
    }
    if (Number.isFinite(completionTokens)) {
        snapshot.completionTokens = completionTokens
    }
    if (Number.isFinite(totalTokens)) {
        snapshot.totalTokens = totalTokens
    }

    const textChars = options.textLength ?? getPayloadTextLength(payload)
    if (textChars > 0) {
        snapshot.textChars = textChars
    }

    const outputChars = [response.content, response.text]
        .filter((item): item is string => typeof item === 'string')
        .join('\n')
        .length
    if (outputChars > 0) {
        snapshot.outputChars = outputChars
    }

    if (normalizedCategory === 'image') {
        const imageCount = Array.isArray(response.images)
            ? response.images.length
            : toNumber(payload.n, 1)
        snapshot.imageCount = imageCount
        const resolution = getImageResolution(payload, response)
        if (resolution) {
            snapshot.imageResolution = resolution
        }
    }

    if (normalizedCategory === 'asr') {
        const usageAudioSeconds = toNumber(usage.audioSeconds, Number.NaN)
        const responseAudioSeconds = toNumber(response.duration, Number.NaN)
        let audioSeconds = options.audioDuration

        if (Number.isFinite(usageAudioSeconds)) {
            audioSeconds = usageAudioSeconds
        } else if (Number.isFinite(responseAudioSeconds)) {
            audioSeconds = responseAudioSeconds
        }

        if (audioSeconds !== undefined && audioSeconds > 0) {
            snapshot.audioSeconds = audioSeconds
        }
    }

    if ((normalizedCategory === 'asr' || normalizedCategory === 'tts' || normalizedCategory === 'podcast') && options.audioSize) {
        snapshot.audioBytes = options.audioSize
    }

    return snapshot
}

function getImageModelFactor(snapshot: AIUsageSnapshot, payload: Record<string, unknown>) {
    const resolution = snapshot.imageResolution || ''
    if (/2048|1792/i.test(resolution) || payload.quality === 'hd') {
        return 2
    }
    if (/1536/i.test(resolution)) {
        return 1.5
    }
    return 1
}

export function calculateQuotaUnits(options: {
    category?: string | null
    type?: string | null
    usageSnapshot?: AIUsageSnapshot | null
    payload?: unknown
}): number {
    const normalizedCategory = normalizeTaskCategory(options.category, options.type)
    const snapshot = options.usageSnapshot || normalizeUsageSnapshot({
        category: normalizedCategory,
        type: options.type || undefined,
        payload: options.payload,
    })
    const payload = parseMaybeJson<Record<string, unknown>>(options.payload)

    let baseMeasure = 1
    if (normalizedCategory === 'text') {
        if (snapshot.totalTokens && snapshot.totalTokens > 0) {
            baseMeasure = Math.max(1, Math.ceil(snapshot.totalTokens / 1000))
        } else if (snapshot.textChars && snapshot.textChars > 0) {
            baseMeasure = Math.max(1, Math.ceil(snapshot.textChars / 800))
        }
    } else if (normalizedCategory === 'image') {
        baseMeasure = Math.max(1, snapshot.imageCount || 1)
        baseMeasure *= getImageModelFactor(snapshot, payload)
    } else if (normalizedCategory === 'asr') {
        if (snapshot.audioSeconds && snapshot.audioSeconds > 0) {
            baseMeasure = Math.max(1, Math.ceil(snapshot.audioSeconds / 30))
        } else if (snapshot.audioBytes && snapshot.audioBytes > 0) {
            baseMeasure = Math.max(1, Math.ceil(snapshot.audioBytes / (1024 * 1024 * 2)))
        }
    } else if (normalizedCategory === 'tts') {
        baseMeasure = Math.max(1, Math.ceil((snapshot.textChars || 0) / 1000))
    } else if (normalizedCategory === 'podcast') {
        const speakerFactor = Array.isArray(payload.voice) ? Math.max(payload.voice.length, 2) / 2 : 1.5
        baseMeasure = Math.max(1, Math.ceil((snapshot.textChars || 0) / 1000)) * speakerFactor
    }

    return roundTo(baseMeasure * CATEGORY_WEIGHTS[normalizedCategory])
}

export function calculateDisplayCost(options: {
    category?: string | null
    type?: string | null
    usageSnapshot?: AIUsageSnapshot | null
    payload?: unknown
    quotaUnits?: number | null
    provider?: string | null
    providerCost?: number | null
    providerCurrency?: string | null
    factors?: Partial<AICostFactors> | AICostFactors | null
}): number {
    const factors = normalizeAICostFactors(options.factors)
    const resolvedQuotaUnits = Number.isFinite(toNumber(options.quotaUnits, Number.NaN))
        ? Math.max(0, toNumber(options.quotaUnits, 0))
        : calculateQuotaUnits({
            category: options.category,
            type: options.type,
            usageSnapshot: options.usageSnapshot,
            payload: options.payload,
        })
    const quotaMappedCost = roundTo(resolvedQuotaUnits * factors.quotaUnitPrice, 4)
    const rawProviderCost = toNumber(options.providerCost, 0)

    if (!Number.isFinite(rawProviderCost) || rawProviderCost <= 0) {
        return quotaMappedCost
    }

    const providerCurrency = options.providerCurrency || resolveProviderCostCurrency(options.provider, factors)
    const convertedProviderCost = convertCostToDisplayCurrency(rawProviderCost, providerCurrency, factors)

    return roundTo(Math.max(quotaMappedCost, convertedProviderCost), 4)
}

export function inferFailureStage(error: unknown, fallback: AIFailureStage = 'provider_processing'): AIFailureStage {
    const rawError = parseMaybeJson<Record<string, unknown>>(error)
    const primaryStatusCode = toNumber(rawError.statusCode, Number.NaN)
    const secondaryStatusCode = toNumber(rawError.status, Number.NaN)
    const statusCode = Number.isFinite(primaryStatusCode) ? primaryStatusCode : secondaryStatusCode

    if (statusCode && [400, 401, 403, 404, 409, 413, 422, 429].includes(statusCode)) {
        return 'provider_rejected'
    }
    return fallback
}

export function deriveChargeStatus(options: ChargeStatusOptions): AIChargeStatus {
    const status = options.status || 'completed'
    const quotaUnits = options.quotaUnits || 0

    if (status === 'pending' || status === 'processing') {
        return 'none'
    }

    if (status === 'failed' && (options.failureStage === 'preflight' || options.failureStage === 'provider_rejected')) {
        return 'waived'
    }

    if (quotaUnits <= 0) {
        return 'none'
    }

    return options.settlementSource || 'actual'
}

export function serializeUsageSnapshot(snapshot: AIUsageSnapshot | null | undefined) {
    if (!snapshot) {
        return null
    }
    return JSON.stringify(snapshot)
}
