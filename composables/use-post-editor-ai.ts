import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'

export function usePostEditorAI(post: any, allTags: any, selectedTags: any) {
    const { t } = useI18n()
    const toast = useToast()

    const aiLoading = ref({
        title: false,
        summary: false,
        tags: false,
        slug: false,
        translate: false,
    })

    const titleSuggestions = ref<string[]>([])
    const titleOp = ref<any>(null)

    const suggestTitles = async (event: any) => {
        if (!post.value.content || post.value.content.length < 10) {
            toast.add({
                severity: 'warn',
                summary: t('common.warn'),
                detail: t('pages.admin.posts.content_too_short'),
                life: 3000,
            })
            return
        }

        const currentTarget = event.currentTarget || event.target

        aiLoading.value.title = true
        try {
            const { data } = await $fetch('/api/ai/suggest-titles', {
                method: 'POST',
                body: {
                    content: post.value.content,
                    language: post.value.language,
                },
            })
            titleSuggestions.value = (data as string[]) || []
            if (titleSuggestions.value.length > 0) {
                titleOp.value?.show(event, currentTarget)
            }
        } catch (error) {
            console.error('AI Title Suggestion error:', error)
            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: t('pages.admin.posts.ai_error'),
                life: 3000,
            })
        } finally {
            aiLoading.value.title = false
        }
    }

    const selectTitle = (suggestion: string) => {
        post.value.title = suggestion
        titleOp.value?.hide()
    }

    const suggestSlug = async () => {
        if (
            !post.value.title
            || !post.value.content
            || post.value.content.length < 10
        ) {
            toast.add({
                severity: 'warn',
                summary: t('common.warn'),
                detail: t('pages.admin.posts.content_too_short'),
                life: 3000,
            })
            return
        }

        aiLoading.value.slug = true
        try {
            const { data } = await $fetch('/api/ai/suggest-slug', {
                method: 'POST',
                body: {
                    title: post.value.title,
                    content: post.value.content,
                },
            })
            post.value.slug = data as string
        } catch (error) {
            console.error('AI Slug error:', error)
            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: t('pages.admin.posts.ai_error'),
                life: 3000,
            })
        } finally {
            aiLoading.value.slug = false
        }
    }

    const suggestSummary = async () => {
        if (!post.value.content || post.value.content.length < 10) {
            toast.add({
                severity: 'warn',
                summary: t('common.warn'),
                detail: t('pages.admin.posts.content_too_short'),
                life: 3000,
            })
            return
        }

        aiLoading.value.summary = true
        try {
            const { data } = await $fetch('/api/ai/summarize', {
                method: 'POST',
                body: {
                    content: post.value.content,
                    language: post.value.language,
                },
            })
            post.value.summary = data as string
        } catch (error) {
            console.error('AI Summary error:', error)
            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: t('pages.admin.posts.ai_error'),
                life: 3000,
            })
        } finally {
            aiLoading.value.summary = false
        }
    }

    const recommendTags = async () => {
        if (!post.value.content || post.value.content.length < 10) {
            toast.add({
                severity: 'warn',
                summary: t('common.warn'),
                detail: t('pages.admin.posts.content_too_short'),
                life: 3000,
            })
            return
        }

        aiLoading.value.tags = true
        try {
            const { data } = await $fetch('/api/ai/recommend-tags', {
                method: 'POST',
                body: {
                    content: post.value.content,
                    existingTags: allTags.value,
                    language: post.value.language,
                },
            })
            const recommended = data as string[]
            recommended.forEach((tag) => {
                if (!selectedTags.value.includes(tag)) {
                    selectedTags.value.push(tag)
                }
            })
        } catch (error) {
            console.error('AI Tags error:', error)
            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: t('pages.admin.posts.ai_error'),
                life: 3000,
            })
        } finally {
            aiLoading.value.tags = false
        }
    }

    const translateContent = async (
        targetLang?: string,
        sourceContent?: string,
        sourceTitle?: string,
        sourceSummary?: string,
    ) => {
        const lang = targetLang || post.value.language
        const content = sourceContent || post.value.content
        const titleToTranslate = sourceTitle || post.value.title
        const summaryToTranslate = sourceSummary || post.value.summary

        if (!content || content.length < 10) {
            toast.add({
                severity: 'warn',
                summary: t('common.warn'),
                detail: t('pages.admin.posts.content_too_short'),
                life: 3000,
            })
            return
        }

        aiLoading.value.translate = true
        try {
            // Translate Title, Summary and Content in parallel where possible
            const translationTasks: Promise<any>[] = []

            // Translate Title if exists
            if (titleToTranslate) {
                translationTasks.push((async () => {
                    const { data: translatedTitle } = await $fetch<any>(
                        '/api/ai/translate-name',
                        {
                            method: 'POST',
                            body: {
                                name: titleToTranslate,
                                targetLanguage: lang,
                            },
                        },
                    )
                    post.value.title = translatedTitle as string
                })())
            }

            // Translate Summary if exists
            if (summaryToTranslate) {
                translationTasks.push((async () => {
                    const { data: translatedSummary } = await $fetch<any>(
                        '/api/ai/translate',
                        {
                            method: 'POST',
                            body: {
                                content: summaryToTranslate,
                                targetLanguage: lang,
                            },
                        },
                    )
                    post.value.summary = translatedSummary as string
                })())
            }

            // Translate Content (Streaming)
            const response = await fetch('/api/ai/translate.stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content,
                    targetLanguage: lang,
                }),
            })

            if (!response.ok) {
                throw new Error('Streaming failed')
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let partialData = ''

            if (reader) {
                // Clear content before starting translation
                post.value.content = ''

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) {
                        break
                    }

                    partialData += decoder.decode(value, { stream: true })
                    const lines = partialData.split('\n')
                    partialData = lines.pop() || ''

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const json = JSON.parse(line.substring(6))
                                if (json.content) {
                                    post.value.content += `${json.content}\n\n`
                                }
                            } catch {
                                // Ignore non-JSON data
                            }
                        } else if (line === 'event: end') {
                            // Stream finished
                        } else if (line.startsWith('event: error')) {
                            // Handle error event if needed
                        }
                    }
                }
                // Trim trailing newlines
                post.value.content = post.value.content.trim()
            }

            // Wait for parallel translation tasks (title, summary) to complete
            await Promise.all(translationTasks)

            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('pages.admin.posts.translate_success'),
                life: 3000,
            })
        } catch (error) {
            console.error('AI Translation error:', error)
            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: t('pages.admin.posts.ai_error'),
                life: 3000,
            })
        } finally {
            aiLoading.value.translate = false
        }
    }

    return {
        aiLoading,
        titleSuggestions,
        titleOp,
        suggestTitles,
        selectTitle,
        suggestSlug,
        suggestSummary,
        recommendTags,
        translateContent,
    }
}
