import { ref, watch, type Ref } from 'vue'
import { resolveTaxonomyAssociationState, type TaxonomyAssociationCandidate } from '@/utils/shared/taxonomy-association'
import { resolveTranslationClusterId } from '@/utils/shared/translation-cluster'

interface TaxonomyAssociationFormState {
    id?: string | null
    translationId?: string | null
    slug?: string | null
}

export function useTaxonomyTranslationAssociation<T extends TaxonomyAssociationCandidate>(options: {
    endpoint: string
    dialogVisible: Ref<boolean>
    locales: Ref<{ code: string }[]>
    multiForm: Ref<Record<string, TaxonomyAssociationFormState>>
}) {
    const associationCandidatesMulti = ref<Record<string, T[]>>({})

    const ensureLocaleBuckets = () => {
        options.locales.value.forEach((locale) => {
            if (!associationCandidatesMulti.value[locale.code]) {
                associationCandidatesMulti.value[locale.code] = []
            }
        })
    }

    const resetAssociationCandidates = () => {
        ensureLocaleBuckets()
        options.locales.value.forEach((locale) => {
            associationCandidatesMulti.value[locale.code] = []
        })
    }

    const resolveAssociationClusterId = (lang: string) => resolveTranslationClusterId(
        options.multiForm.value[lang]?.translationId,
        options.multiForm.value[lang]?.slug,
        options.multiForm.value[lang]?.id,
    )

    const fetchAssociationCandidates = async (lang: string) => {
        const translationClusterId = resolveAssociationClusterId(lang)
        if (!translationClusterId) {
            associationCandidatesMulti.value[lang] = []
            return
        }

        try {
            const response = await $fetch<{ data?: { items?: T[] } }>(options.endpoint, {
                query: {
                    translationId: translationClusterId,
                    aggregate: false,
                    limit: 20,
                },
            })

            if (resolveAssociationClusterId(lang) !== translationClusterId) {
                return
            }

            associationCandidatesMulti.value[lang] = response.data?.items || []
        } catch (error) {
            console.error(`Failed to fetch taxonomy translation association candidates from ${options.endpoint}`, error)
            associationCandidatesMulti.value[lang] = []
        }
    }

    const getAssociationState = (lang: string) => resolveTaxonomyAssociationState({
        currentId: options.multiForm.value[lang]?.id,
        currentLanguage: lang,
        translationId: options.multiForm.value[lang]?.translationId,
        slug: options.multiForm.value[lang]?.slug,
        candidates: associationCandidatesMulti.value[lang],
    })

    ensureLocaleBuckets()

    watch(() => options.locales.value.map((locale) => locale.code).join('|'), () => {
        ensureLocaleBuckets()
    }, { immediate: true })

    watch(() => options.dialogVisible.value, (visible) => {
        if (!visible) {
            resetAssociationCandidates()
            return
        }

        options.locales.value.forEach((locale) => {
            void fetchAssociationCandidates(locale.code)
        })
    })

    watch(() => options.locales.value.map((locale) => [
        locale.code,
        options.multiForm.value[locale.code]?.translationId || '',
        options.multiForm.value[locale.code]?.slug || '',
        options.multiForm.value[locale.code]?.id || '',
    ].join(':')), () => {
        if (!options.dialogVisible.value) {
            return
        }

        options.locales.value.forEach((locale) => {
            void fetchAssociationCandidates(locale.code)
        })
    })

    return {
        getAssociationState,
        resetAssociationCandidates,
    }
}
