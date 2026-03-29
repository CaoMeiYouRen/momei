export const toBoolean = (value: unknown, fallback = false): boolean => {
    if (typeof value === 'boolean') {
        return value
    }

    if (typeof value === 'number') {
        if (value === 1) {
            return true
        }

        if (value === 0) {
            return false
        }
    }

    if (typeof value === 'string') {
        const normalized = value.trim().replace(/^['"]|['"]$/g, '').toLowerCase()

        if (['true', '1', 'yes', 'on'].includes(normalized)) {
            return true
        }

        if (['false', '0', 'no', 'off'].includes(normalized)) {
            return false
        }
    }

    return fallback
}

export const toNumber = (value: unknown, fallback = 0): number => {
    const num = Number(value)
    return Number.isFinite(num) ? num : fallback
}

export const normalizeOptionalString = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim()
    return normalized || null
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
