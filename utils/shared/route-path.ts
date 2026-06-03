export function normalizeRoutePath(path: string, localeCodes: readonly string[]) {
    if (!path) {
        return '/'
    }

    const normalizedSource = path.startsWith('/') ? path : `/${path}`
    const segments = normalizedSource.split('/')
    const firstSegment = segments[1]
    const strippedLocalePath = firstSegment && localeCodes.includes(firstSegment)
        ? `/${segments.slice(2).join('/')}`
        : normalizedSource

    if (!strippedLocalePath || strippedLocalePath === '//') {
        return '/'
    }

    if (strippedLocalePath.length > 1 && strippedLocalePath.endsWith('/')) {
        return strippedLocalePath.slice(0, -1)
    }

    return strippedLocalePath
}
