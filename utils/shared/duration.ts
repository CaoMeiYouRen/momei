import { ms, type StringValue } from 'ms'

type DurationInput = string | number | null | undefined

interface NormalizeDurationOptions {
    min?: number
    max?: number
}

export function parseDurationSeconds(value: DurationInput): number | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? Math.floor(value) : null
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
        return Math.floor(numericValue)
    }

    try {
        const parsedMilliseconds = ms(normalized as StringValue)

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
    const parsedValue = parseDurationSeconds(value)
    let nextValue = parsedValue ?? fallbackSeconds

    nextValue = Math.floor(nextValue)

    if (options.min !== undefined) {
        nextValue = Math.max(options.min, nextValue)
    }

    if (options.max !== undefined) {
        nextValue = Math.min(options.max, nextValue)
    }

    return nextValue
}

export function parseDurationMinutes(value: DurationInput): number | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? Math.floor(value) : null
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
        return Math.floor(numericValue)
    }

    const parsedSeconds = parseDurationSeconds(normalized)

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
    const parsedValue = parseDurationMinutes(value)
    let nextValue = parsedValue ?? fallbackMinutes

    nextValue = Math.floor(nextValue)

    if (options.min !== undefined) {
        nextValue = Math.max(options.min, nextValue)
    }

    if (options.max !== undefined) {
        nextValue = Math.min(options.max, nextValue)
    }

    return nextValue
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
