import { ref, type Ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import type { PostEditorData } from '@/types/post-editor'

const MIN_TASK_POLLING_INTERVAL = 10000

interface TranslateDirectResult {
    mode: 'direct'
    content: string
}

interface TranslateTaskResult {
    mode: 'task'
    taskId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
}

type TranslateApiResult = string | TranslateDirectResult | TranslateTaskResult

interface AITaskStatusPayload {
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    result?: string | {
        content?: string
    }
    error?: string | null
}

export function usePostEditorAI(
    post: Ref<PostEditorData>,
    allTags: Ref<string[]>,
    selectedTags: Ref<string[]>,
) {
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

    const extractTranslatedContent = (result: AITaskStatusPayload['result']) => {
        if (!result) {
            return ''
        }

        if (typeof result === 'string') {
            try {
                const parsed = JSON.parse(result) as { content?: string }
                return parsed.content || ''
            } catch {
                return result
            }
        }

        return result.content || ''
    }

    const toError = (error: unknown) => {
        if (error instanceof Error) {
            return error
        }

        return new Error(t('pages.admin.posts.ai_error'))
    }

    const waitForTranslationTask = async (taskId: string) => await new Promise<string>((resolve, reject) => {
        let settled = false
        let requestInFlight = false
        const pollingController: { stop?: () => void } = {}

        const finalize = (handler: () => void) => {
            if (settled) {
                return
            }

            settled = true
            pollingController.stop?.()
            handler()
        }

        const pollTask = async () => {
            if (settled || requestInFlight) {
                return
            }

            requestInFlight = true
            try {
                const response = await $fetch<{ code: number, data: AITaskStatusPayload }>(
                    `/api/ai/task/status/${taskId}`,
                )
                const task = response.data

                if (task.status === 'completed') {
                    finalize(() => resolve(extractTranslatedContent(task.result)))
                    return
                }

                if (task.status === 'failed') {
                    finalize(() => reject(new Error(task.error || t('pages.admin.posts.ai_error'))))
                }
            } catch (error) {
                finalize(() => reject(toError(error)))
            } finally {
                requestInFlight = false
            }
        }

        const { pause, resume } = useIntervalFn(() => {
            void pollTask()
        }, MIN_TASK_POLLING_INTERVAL, { immediate: false })

        pollingController.stop = pause
        void pollTask()
        resume()
    })

    const requestTranslatedText = async (content: string, targetLanguage: string) => {
        const response = await $fetch<{ code: number, data: TranslateApiResult }>('/api/ai/translate', {
            method: 'POST',
            body: {
                content,
                targetLanguage,
            },
        })

        const result = response.data
        if (typeof result === 'string') {
            return result
        }

        if (result.mode === 'direct') {
            return result.content
        }

        return await waitForTranslationTask(result.taskId)
    }

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
            titleSuggestions.value = (data) || []
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
            post.value.slug = data
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
            post.value.summary = data
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
            const recommended = data
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
                    post.value.summary = await requestTranslatedText(
                        summaryToTranslate,
                        lang,
                    )
                })())
            }

            post.value.content = await requestTranslatedText(content, lang)

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
