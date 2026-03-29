export interface NormalizeStringListOptions {
    dedupe?: boolean
    lowercase?: boolean
    limit?: number
}

export interface SplitAndNormalizeStringListOptions extends NormalizeStringListOptions {
    delimiters?: RegExp | string
}

function normalizeStringItem(value: string, options: NormalizeStringListOptions) {
    const normalized = value.trim()

    if (!normalized) {
        return null
    }

    return options.lowercase ? normalized.toLowerCase() : normalized
}

export function normalizeStringList(values: readonly string[], options: NormalizeStringListOptions = {}) {
    const normalizedValues: string[] = []
    const seenValues = options.dedupe ? new Set<string>() : null

    for (const value of values) {
        const normalized = normalizeStringItem(value, options)

        if (!normalized) {
            continue
        }

        if (seenValues?.has(normalized)) {
            continue
        }

        seenValues?.add(normalized)
        normalizedValues.push(normalized)

        if (options.limit && normalizedValues.length >= options.limit) {
            break
        }
    }

    return normalizedValues
}

export function splitAndNormalizeStringList(
    value: string | null | undefined,
    options: SplitAndNormalizeStringListOptions = {},
) {
    if (!value) {
        return []
    }

    return normalizeStringList(
        value.split(options.delimiters ?? /[;,，、]+/),
        options,
    )
}
