import { normalizeOptionalString } from './coerce'

export function isAbsoluteHttpUrl(value: string) {
    return /^https?:\/\//iu.test(value)
}

export function ensureTrailingSlash(value: string) {
    return value.endsWith('/') ? value : `${value}/`
}

export function normalizeBaseUrl(value: unknown): string | null {
    const normalized = normalizeOptionalString(value)
    if (!normalized) {
        return null
    }

    return ensureTrailingSlash(normalized)
}

export function buildAbsoluteUrl(baseUrl: string, path = '/') {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path
    return new URL(normalizedPath, ensureTrailingSlash(baseUrl)).toString()
}

export function joinBaseUrlAndPath(baseUrl: string, path: string) {
    if (isAbsoluteHttpUrl(baseUrl)) {
        return buildAbsoluteUrl(baseUrl, path)
    }

    return `${ensureTrailingSlash(baseUrl)}${path.replace(/^\/+/, '')}`.replace(/\/+/g, '/').replace(':/', '://')
}
