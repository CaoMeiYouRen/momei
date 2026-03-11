export interface TranslationClusterLike {
    id?: string | null
    slug?: string | null
    translationId?: string | null
}

const normalizeClusterValue = (value?: string | null) => {
    const normalizedValue = value?.trim()
    return normalizedValue ? normalizedValue : null
}

export const resolveTranslationClusterId = (
    translationId?: string | null,
    slug?: string | null,
    fallbackId?: string | null,
) => normalizeClusterValue(translationId)
    || normalizeClusterValue(slug)
    || normalizeClusterValue(fallbackId)

export const getTranslationClusterCandidates = (
    item?: TranslationClusterLike | null,
    options?: { includeId?: boolean },
) => {
    if (!item) {
        return []
    }

    const candidates = [
        normalizeClusterValue(item.translationId),
        normalizeClusterValue(item.slug),
        options?.includeId ? normalizeClusterValue(item.id) : null,
    ].filter((candidate): candidate is string => Boolean(candidate))

    return Array.from(new Set(candidates))
}

export const hasSharedTranslationCluster = (
    source?: TranslationClusterLike | null,
    target?: TranslationClusterLike | null,
    options?: {
        includeSourceId?: boolean
        includeTargetId?: boolean
    },
) => {
    const sourceCandidates = getTranslationClusterCandidates(source, { includeId: options?.includeSourceId })
    const targetCandidates = new Set(getTranslationClusterCandidates(target, { includeId: options?.includeTargetId }))

    return sourceCandidates.some((candidate) => targetCandidates.has(candidate))
}
