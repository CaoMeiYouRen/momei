import type { AICategory, AIChargeStatus, AIFailureStage, AIUsageSnapshot } from '@/types/ai'

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

function roundTo(value: number, digits: number = 2) {
    return Number(value.toFixed(digits))
}

function toNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value)
        if (Number.isFinite(parsed)) {
            return parsed
        }
    }
    return undefined
}

function parseMaybeJson<T = Record<string, any>>(value: unknown): T {
    if (!value) {
        return {} as T
    }
    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as T
        } catch {
            return {} as T
        }
    }
    if (typeof value === 'object') {
        return value as T
    }
    return {} as T
}

function getPayloadTextLength(payload: Record<string, any>) {
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

function getImageResolution(payload: Record<string, any>, response: Record<string, any>) {
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
    const payload = parseMaybeJson<Record<string, any>>(options.payload)
    const response = parseMaybeJson<Record<string, any>>(options.response)
    const usage = parseMaybeJson<Record<string, any>>(response.usage)
    const normalizedCategory = normalizeTaskCategory(options.category, options.type)

    const snapshot: AIUsageSnapshot = {
        requestCount: 1,
    }

    const promptTokens = toNumber(usage.promptTokens)
    const completionTokens = toNumber(usage.completionTokens)
    const totalTokens = toNumber(usage.totalTokens)
    if (promptTokens !== undefined) {
        snapshot.promptTokens = promptTokens
    }
    if (completionTokens !== undefined) {
        snapshot.completionTokens = completionTokens
    }
    if (totalTokens !== undefined) {
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
            : toNumber(payload.n) || 1
        snapshot.imageCount = imageCount
        const resolution = getImageResolution(payload, response)
        if (resolution) {
            snapshot.imageResolution = resolution
        }
    }

    if (normalizedCategory === 'asr') {
        const audioSeconds = toNumber(usage.audioSeconds)
            ?? toNumber(response.duration)
            ?? options.audioDuration
        if (audioSeconds !== undefined && audioSeconds > 0) {
            snapshot.audioSeconds = audioSeconds
        }
    }

    if ((normalizedCategory === 'asr' || normalizedCategory === 'tts' || normalizedCategory === 'podcast') && options.audioSize) {
        snapshot.audioBytes = options.audioSize
    }

    return snapshot
}

function getImageModelFactor(snapshot: AIUsageSnapshot, payload: Record<string, any>) {
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
    const payload = parseMaybeJson<Record<string, any>>(options.payload)

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
        baseMeasure = Math.max(1, Math.ceil((snapshot.audioSeconds || 0) / 30))
    } else if (normalizedCategory === 'tts') {
        baseMeasure = Math.max(1, Math.ceil((snapshot.textChars || 0) / 1000))
    } else if (normalizedCategory === 'podcast') {
        const speakerFactor = Array.isArray(payload.voice) ? Math.max(payload.voice.length, 2) / 2 : 1.5
        baseMeasure = Math.max(1, Math.ceil((snapshot.textChars || 0) / 1000)) * speakerFactor
    }

    return roundTo(baseMeasure * CATEGORY_WEIGHTS[normalizedCategory])
}

export function inferFailureStage(error: unknown, fallback: AIFailureStage = 'provider_processing'): AIFailureStage {
    const statusCode = toNumber((error as any)?.statusCode) ?? toNumber((error as any)?.status)
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
