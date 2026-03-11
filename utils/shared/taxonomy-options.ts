import { resolveTranslationClusterId } from './translation-cluster'
import { getLocaleRegistryItem, resolveAppLocaleCode } from '@/i18n/config/locale-registry'

export interface TaxonomyTranslationOption {
    id: string
    name: string
    language?: string
    slug?: string | null
    translationId?: string | null
    translations?: TaxonomyTranslationOption[] | null
}

export function resolveTaxonomyDisplayLanguageOrder(contentLanguage?: string, uiLanguage?: string) {
    const preferredContentLanguage = resolveAppLocaleCode(contentLanguage)
    const uiFallbackChain = getLocaleRegistryItem(uiLanguage || preferredContentLanguage).fallbackChain
    const contentFallbackChain = getLocaleRegistryItem(preferredContentLanguage).fallbackChain

    return Array.from(new Set([
        preferredContentLanguage,
        ...uiFallbackChain,
        ...contentFallbackChain,
    ]))
}

export function buildPreferredTaxonomyOptions<T extends TaxonomyTranslationOption>(
    items: T[],
    options: {
        contentLanguage?: string
        uiLanguage?: string
    },
) {
    const preferredLanguages = resolveTaxonomyDisplayLanguageOrder(options.contentLanguage, options.uiLanguage)

    return items.map((item) => {
        const candidates = Array.from(new Map(
            [item, ...(item.translations || [])].map((candidate) => [candidate.id, candidate]),
        ).values()) as T[]

        const preferredCandidate = preferredLanguages
            .map((language) => candidates.find((candidate) => candidate.language === language))
            .find((candidate): candidate is T => Boolean(candidate))
            || candidates[0]
            || item

        return {
            ...item,
            ...preferredCandidate,
            translationId: resolveTranslationClusterId(
                preferredCandidate.translationId,
                preferredCandidate.slug,
                item.translationId || item.id,
            ),
            translations: candidates,
        }
    })
}
