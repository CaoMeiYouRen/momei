export function toQueryString(value: unknown): string | undefined {
    const raw = Array.isArray(value) ? value[0] : value
    return typeof raw === 'string' ? raw : undefined
}

export function toQueryStringArray(value: unknown): string[] | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const rawValues = Array.isArray(value) ? value : [value]
    const values = rawValues.filter((item): item is string => typeof item === 'string')
    return values.length > 0 ? values : undefined
}
