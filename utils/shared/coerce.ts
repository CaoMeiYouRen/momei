export const toBoolean = (value: unknown, fallback = false): boolean => {
    if (typeof value === 'boolean') {
        return value
    }
    if (typeof value === 'string') {
        return value === 'true'
    }
    return fallback
}

export const toNumber = (value: unknown, fallback = 0): number => {
    const num = Number(value)
    return Number.isFinite(num) ? num : fallback
}

export const parseMaybeJson = <T = Record<string, unknown>>(value: unknown, fallback?: T): T => {
    const normalizedFallback = fallback ?? ({} as T)

    if (!value) {
        return normalizedFallback
    }

    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as T
        } catch {
            return normalizedFallback
        }
    }

    if (typeof value === 'object') {
        return value as T
    }

    return normalizedFallback
}
