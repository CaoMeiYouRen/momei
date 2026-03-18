function sortObjectEntries(value: Record<string, unknown>) {
    return Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
}

export function stableSerialize(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map((item) => stableSerialize(item)).join(',')}]`
    }

    if (value && typeof value === 'object') {
        return `{${sortObjectEntries(value as Record<string, unknown>)
            .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`)
            .join(',')}}`
    }

    return JSON.stringify(value)
}
