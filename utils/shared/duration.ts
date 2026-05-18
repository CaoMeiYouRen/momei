import { ms, type StringValue } from 'ms'

type DurationInput = string | number | null | undefined

interface NormalizeDurationOptions {
    min?: number
    max?: number
}

type NormalizedDurationInput =
    | { kind: 'numeric', value: number }
    | { kind: 'string', value: string }

function normalizeDurationInput(value: DurationInput): NormalizedDurationInput | null {
    if (typeof value === 'number') {
        return Number.isFinite(value)
            ? { kind: 'numeric', value: Math.floor(value) }
            : null
    }

    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim()

    if (!normalized) {
        return null
    }

    const numericValue = Number(normalized)

    if (Number.isFinite(numericValue)) {
        return { kind: 'numeric', value: Math.floor(numericValue) }
    }

    return { kind: 'string', value: normalized }
}

function normalizeDurationFallback(
    parsedValue: number | null,
    fallbackValue: number,
    options: NormalizeDurationOptions = {},
) {
    let nextValue = Math.floor(parsedValue ?? fallbackValue)

    if (options.min !== undefined) {
        nextValue = Math.max(options.min, nextValue)
    }

    if (options.max !== undefined) {
        nextValue = Math.min(options.max, nextValue)
    }

    return nextValue
}

export function parseDurationSeconds(value: DurationInput): number | null {
    const normalizedInput = normalizeDurationInput(value)

    if (normalizedInput === null) {
        return null
    }

    if (normalizedInput.kind === 'numeric') {
        return normalizedInput.value
    }

    try {
        const parsedMilliseconds = ms(normalizedInput.value as StringValue)

        if (typeof parsedMilliseconds === 'number' && Number.isFinite(parsedMilliseconds)) {
            return Math.floor(parsedMilliseconds / 1000)
        }
    } catch {
        return null
    }

    return null
}

export function normalizeDurationSeconds(
    value: DurationInput,
    fallbackSeconds: number,
    options: NormalizeDurationOptions = {},
) {
    return normalizeDurationFallback(parseDurationSeconds(value), fallbackSeconds, options)
}

export function parseDurationMinutes(value: DurationInput): number | null {
    const normalizedInput = normalizeDurationInput(value)

    if (normalizedInput === null) {
        return null
    }

    if (normalizedInput.kind === 'numeric') {
        return normalizedInput.value
    }

    const parsedSeconds = parseDurationSeconds(normalizedInput.value)

    if (parsedSeconds === null) {
        return null
    }

    return Math.ceil(parsedSeconds / 60)
}

export function normalizeDurationMinutes(
    value: DurationInput,
    fallbackMinutes: number,
    options: NormalizeDurationOptions = {},
) {
    return normalizeDurationFallback(parseDurationMinutes(value), fallbackMinutes, options)
}

export function formatDurationSecondsForInput(value: number | null | undefined, fallback = '0s') {
    if (!Number.isFinite(value) || value === null || value === undefined || value < 0) {
        return fallback
    }

    const normalizedValue = Math.floor(value)
    const units: [suffix: string, seconds: number][] = [
        ['d', 24 * 60 * 60],
        ['h', 60 * 60],
        ['m', 60],
        ['s', 1],
    ]

    for (const [suffix, seconds] of units) {
        if (normalizedValue >= seconds && normalizedValue % seconds === 0) {
            return `${normalizedValue / seconds}${suffix}`
        }
    }

    return `${normalizedValue}s`
}

export function formatDurationMinutesForInput(value: number | null | undefined, fallback = '0m') {
    if (!Number.isFinite(value) || value === null || value === undefined || value < 0) {
        return fallback
    }

    return formatDurationSecondsForInput(Math.floor(value) * 60, fallback)
}
