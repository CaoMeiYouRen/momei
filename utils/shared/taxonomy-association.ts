import { resolveTranslationClusterId } from './translation-cluster'

export interface TaxonomyAssociationCandidate {
    id: string
    name: string
    language: string
    slug?: string | null
    translationId?: string | null
}

export interface TaxonomyAssociationState<T extends TaxonomyAssociationCandidate> {
    clusterId: string | null
    usesSlugFallback: boolean
    sameLanguageConflict: T | null
    linkedPeers: T[]
    relatedCandidates: T[]
}

export function resolveTaxonomyAssociationState<T extends TaxonomyAssociationCandidate>(options: {
    currentId?: string | null
    currentLanguage: string
    translationId?: string | null
    slug?: string | null
    candidates?: T[] | null
}): TaxonomyAssociationState<T> {
    const clusterId = resolveTranslationClusterId(
        options.translationId,
        options.slug,
        options.currentId,
    )

    if (!clusterId) {
        return {
            clusterId: null,
            usesSlugFallback: false,
            sameLanguageConflict: null,
            linkedPeers: [],
            relatedCandidates: [],
        }
    }

    const relatedCandidates = Array.from(new Map((options.candidates || [])
        .filter((candidate) => candidate.id !== options.currentId)
        .filter((candidate) => resolveTranslationClusterId(candidate.translationId, candidate.slug, candidate.id) === clusterId)
        .map((candidate) => [candidate.id, candidate])).values())

    return {
        clusterId,
        usesSlugFallback: !options.translationId && Boolean(options.slug) && clusterId === options.slug,
        sameLanguageConflict: relatedCandidates.find((candidate) => candidate.language === options.currentLanguage) || null,
        linkedPeers: relatedCandidates.filter((candidate) => candidate.language !== options.currentLanguage),
        relatedCandidates,
    }
}
