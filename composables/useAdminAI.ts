import { isPureEnglish } from '@/utils/shared/validate'

export const useAdminAI = (multiForm: Ref<Record<string, any>>, activeTab: Ref<string>) => {
    const { t, locales } = useI18n()
    const toast = useToast()

    const aiLoading = ref<Record<string, { name: boolean, slug: boolean }>>(
        Object.fromEntries(locales.value.map((l: any) => [l.code, { name: false, slug: false }])),
    )

    const translateName = async (lang: string) => {
        // Find the first language with a name as the source
        const sourceLang = locales.value.find((l: any) => multiForm.value[l.code].name && l.code !== lang)?.code
        if (!sourceLang) {
            toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('common.no_source_content'), life: 3000 })
            return
        }

        if (!aiLoading.value[lang]) {
            return
        }
        aiLoading.value[lang].name = true
        try {
            const { data } = await $fetch<any>('/api/ai/translate-name', {
                method: 'POST',
                body: {
                    name: multiForm.value[sourceLang].name,
                    targetLanguage: t(`common.languages.${lang}`),
                },
            })
            multiForm.value[lang].name = data as string
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
        if (!multiForm.value[lang].name) {
            toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('common.no_source_content'), life: 3000 })
            return
        }

        if (!aiLoading.value[lang]) {
            return
        }
        aiLoading.value[lang].slug = true
        try {
            const { data } = await $fetch<any>('/api/ai/suggest-slug-from-name', {
                method: 'POST',
                body: {
                    name: multiForm.value[lang].name,
                },
            })
            multiForm.value[lang].slug = data as string
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
        const sourceForm = multiForm.value[sourceLang]
        if (!sourceForm.name) {
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
        for (const l of locales.value) {
            if (l.code === sourceLang) {
                continue
            }
            const targetForm = multiForm.value[l.code]

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
                    await translateName(l.code)
                }
                if (targetForm.name && !targetForm.slug) {
                    await generateSlug(l.code)
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
