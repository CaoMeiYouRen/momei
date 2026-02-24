export const toBoolean = (value: unknown, fallback = false): boolean => {
    if (typeof value === 'boolean') { return value }
    if (typeof value === 'string') { return value === 'true' }
    return fallback
}

export const toNumber = (value: unknown, fallback: number): number => {
    const num = Number(value)
    return Number.isFinite(num) ? num : fallback
}
