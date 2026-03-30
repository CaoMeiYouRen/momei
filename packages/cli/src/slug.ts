interface NormalizeAsciiSlugOptions {
    allowSlash?: boolean
    allowUnderscore?: boolean
    stripQuotes?: boolean
}

export function normalizeAsciiSlug(value: string, options: NormalizeAsciiSlugOptions = {}) {
    const normalized = options.stripQuotes
        ? value.trim().toLowerCase().replace(/['"`]/g, '')
        : value.trim().toLowerCase()

    let disallowedPattern = /[^a-z0-9-]+/g

    if (options.allowSlash && options.allowUnderscore) {
        disallowedPattern = /[^a-z0-9/_-]+/g
    } else if (options.allowSlash) {
        disallowedPattern = /[^a-z0-9/-]+/g
    } else if (options.allowUnderscore) {
        disallowedPattern = /[^a-z0-9_-]+/g
    }

    return normalized
        .replace(disallowedPattern, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
}
