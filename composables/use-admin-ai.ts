import { isPureEnglish } from '@/utils/shared/validate'

interface AdminAiFormEntry {
    id?: string | null
    name: string
    slug: string
    translationId?: string | null
}

interface AdminAiLocaleOption {
    code: string
}

interface AdminAiStringResponse {
    data: string
}

function getAdminAiFormEntry(
    multiForm: Ref<Record<string, AdminAiFormEntry>>,
    lang: string,
) {
    return multiForm.value[lang]
}

function isAdminAiLocaleOption(value: unknown): value is AdminAiLocaleOption {
    return typeof value === 'object' && value !== null
        && 'code' in value
        && typeof value.code === 'string'
}

export const useAdminAI = (multiForm: Ref<Record<string, AdminAiFormEntry>>, activeTab: Ref<string>) => {
    const { t, locales } = useI18n()
    const toast = useToast()
    const localeEntries = (Array.isArray(locales.value) ? locales.value : []).filter(isAdminAiLocaleOption)

    const aiLoading = ref<Record<string, { name: boolean, slug: boolean }>>(
        Object.fromEntries(localeEntries.map((locale) => [locale.code, { name: false, slug: false }])),
    )

    const translateName = async (lang: string) => {
        // Find the first language with a name as the source
        const sourceLang = localeEntries.find((locale) => multiForm.value[locale.code]?.name && locale.code !== lang)?.code
        if (!sourceLang) {
            toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('common.no_source_content'), life: 3000 })
            return
        }

        const sourceForm = multiForm.value[sourceLang]
        if (!sourceForm?.name) {
            return
        }

        if (!aiLoading.value[lang]) {
            return
        }
        aiLoading.value[lang].name = true
        try {
            const { data } = await $fetch<AdminAiStringResponse>('/api/ai/translate-name', {
                method: 'POST',
                body: {
                    name: sourceForm.name,
                    targetLanguage: t(`common.languages.${lang}`),
                },
            })
            if (multiForm.value[lang]) {
                multiForm.value[lang].name = data
            }
        } catch (error) {
            console.error('AI Translate error:', error)
            toast.add({ severity: 'error', summary: t('common.error'), detail: t('pages.admin.posts.ai_error'), life: 3000 })
        } finally {
            if (aiLoading.value[lang]) {
                aiLoading.value[lang].name = false
            }
        }
    }

    const generateSlug = async (lang: string) => {
        const targetForm = getAdminAiFormEntry(multiForm, lang)
        if (!targetForm?.name) {
            toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('common.no_source_content'), life: 3000 })
            return
        }

        if (!aiLoading.value[lang]) {
            return
        }
        aiLoading.value[lang].slug = true
        try {
            const { data } = await $fetch<AdminAiStringResponse>('/api/ai/suggest-slug-from-name', {
                method: 'POST',
                body: {
                    name: targetForm.name,
                },
            })
            targetForm.slug = data
        } catch (error) {
            console.error('AI Slug error:', error)
            toast.add({ severity: 'error', summary: t('common.error'), detail: t('pages.admin.posts.ai_error'), life: 3000 })
        } finally {
            if (aiLoading.value[lang]) {
                aiLoading.value[lang].slug = false
            }
        }
    }

    const syncAIAllLanguages = async () => {
        const sourceLang = activeTab.value
        const sourceForm = getAdminAiFormEntry(multiForm, sourceLang)
        if (!sourceForm?.name) {
            return
        }

        const isEnglish = isPureEnglish(sourceForm.name)

        // 1. If current slug is empty, generate it
        if (!sourceForm.slug) {
            await generateSlug(sourceLang)
        }

        // 2. Sync translationId
        if (sourceForm.slug && !sourceForm.translationId) {
            sourceForm.translationId = sourceForm.slug
        }

        const sharedTranslationId = sourceForm.translationId

        // 3. Loop through other languages
        for (const locale of localeEntries) {
            if (locale.code === sourceLang) {
                continue
            }
            const targetForm = multiForm.value[locale.code]
            if (!targetForm) {
                continue
            }

            // Skip if it already has an ID (already exists in DB)
            if (targetForm.id) {
                continue
            }

            if (isEnglish) {
                targetForm.name = sourceForm.name
                targetForm.slug = sourceForm.slug
            } else {
                // Use AI to translate name and generate slug if they are empty
                if (!targetForm.name) {
                    await translateName(locale.code)
                }
                if (targetForm.name && !targetForm.slug) {
                    await generateSlug(locale.code)
                }
            }

            if (sharedTranslationId && !targetForm.translationId) {
                targetForm.translationId = sharedTranslationId
            }
        }
    }

    return {
        aiLoading,
        translateName,
        generateSlug,
        syncAIAllLanguages,
    }
}
