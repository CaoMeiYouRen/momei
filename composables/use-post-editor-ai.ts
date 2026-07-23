import { ref, type Ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import type { PostEditorData } from '@/types/post-editor'
import type { RewriteStyle, AIReviewSuggestion } from '@/types/ai'

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

export interface TitleSuggestionOverlayRef {
    show?: (event: Event, target?: EventTarget | null) => void
    hide?: () => void
}

interface TitleSuggestionTriggerEvent {
    currentTarget?: EventTarget | null
    target?: EventTarget | null
}

interface StringListResponse {
    data: string[]
}

interface StringResponse {
    data: string
}

interface ReviewResponse {
    data: AIReviewSuggestion[]
}

/**
 * 封装文章编辑器里的 AI 辅助动作。
 *
 * 契约：统一暴露标题、摘要、标签、slug 和翻译入口，并把 AI 结果直接回写到当前文章草稿。
 * 副作用：会发起 AI 请求、轮询异步任务状态，并通过 toast 向编辑器反馈成功或失败结果。
 */
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
        rewrite: false,
        review: false,
    })

    const titleSuggestions = ref<string[]>([])
    const titleOp = ref<TitleSuggestionOverlayRef | null>(null)

    // 归一化 task result 载荷，兼容 string 和 object 两种完成态形态。
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

    // 轮询链路始终保持单请求在途，并在终态或网络错误后立即停表，避免重复请求与悬挂定时器。
    const waitForTranslationTask = async (taskId: string) => new Promise<string>((resolve, reject) => {
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

    // 翻译接口既可能同步直返结果，也可能下发异步任务，调用方只关心最终文本时统一走这里收敛。
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

        return waitForTranslationTask(result.taskId)
    }

    const suggestTitles = async (event: TitleSuggestionTriggerEvent) => {
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
            const { data } = await $fetch<StringListResponse>('/api/ai/suggest-titles', {
                method: 'POST',
                body: {
                    content: post.value.content,
                    language: post.value.language,
                },
            })
            titleSuggestions.value = data || []
            if (titleSuggestions.value.length > 0) {
                titleOp.value?.show?.(event as Event, currentTarget)
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
        titleOp.value?.hide?.()
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
            const { data } = await $fetch<StringResponse>('/api/ai/suggest-slug', {
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
            const { data } = await $fetch<StringResponse>('/api/ai/summarize', {
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
            const { data } = await $fetch<StringListResponse>('/api/ai/recommend-tags', {
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
            const translationTasks: Promise<void>[] = []

            // Translate Title if exists
            if (titleToTranslate) {
                translationTasks.push((async () => {
                    const { data: translatedTitle } = await $fetch<StringResponse>(
                        '/api/ai/translate-name',
                        {
                            method: 'POST',
                            body: {
                                name: titleToTranslate,
                                targetLanguage: lang,
                            },
                        },
                    )
                    post.value.title = translatedTitle
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

    /**
     * 获取编辑器 textarea 中选中的文本。
     * 如果没有选中文本，返回 null。
     */
    const getEditorSelectedText = (): { text: string, start: number, end: number } | null => {
        const textarea = document.querySelector('.auto-textarea-input')
        if (!(textarea instanceof HTMLTextAreaElement)) {
            return null
        }

        const { selectionStart, selectionEnd, value } = textarea
        if (selectionStart === selectionEnd) {
            return null
        }

        return {
            text: value.substring(selectionStart, selectionEnd),
            start: selectionStart,
            end: selectionEnd,
        }
    }

    /**
     * 替换编辑器中指定范围的文本。
     */
    const replaceEditorSelection = (start: number, end: number, replacement: string) => {
        const textarea = document.querySelector('.auto-textarea-input')
        if (!(textarea instanceof HTMLTextAreaElement)) {
            return
        }

        const before = post.value.content.substring(0, start)
        const after = post.value.content.substring(end)
        post.value.content = before + replacement + after

        // 恢复焦点并将光标移动到替换文本末尾
        textarea.focus()
        textarea.setSelectionRange(start + replacement.length, start + replacement.length)
    }

    const rewriteContent = async (style: RewriteStyle = 'casual') => {
        const selected = getEditorSelectedText()
        const contentToRewrite = selected ? selected.text : post.value.content

        if (!contentToRewrite || contentToRewrite.trim().length < 2) {
            toast.add({
                severity: 'warn',
                summary: t('common.warn'),
                detail: t('pages.admin.posts.content_too_short'),
                life: 3000,
            })
            return
        }

        aiLoading.value.rewrite = true
        try {
            const { data } = await $fetch<StringResponse>('/api/ai/rewrite', {
                method: 'POST',
                body: {
                    content: contentToRewrite,
                    style,
                    language: post.value.language,
                },
            })

            if (selected) {
                replaceEditorSelection(selected.start, selected.end, data)
            } else {
                post.value.content = data
            }

            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('pages.admin.posts.ai.rewrite_success'),
                life: 3000,
            })
        } catch (error) {
            console.error('AI Rewrite error:', error)
            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: t('pages.admin.posts.ai_error'),
                life: 3000,
            })
        } finally {
            aiLoading.value.rewrite = false
        }
    }

    const reviewSuggestions = ref<AIReviewSuggestion[]>([])
    const reviewPanelVisible = ref(false)

    const reviewContent = async () => {
        if (!post.value.content || post.value.content.trim().length < 10) {
            toast.add({
                severity: 'warn',
                summary: t('common.warn'),
                detail: t('pages.admin.posts.content_too_short'),
                life: 3000,
            })
            return
        }

        aiLoading.value.review = true
        try {
            const { data } = await $fetch<ReviewResponse>('/api/ai/review', {
                method: 'POST',
                body: {
                    content: post.value.content,
                    language: post.value.language,
                },
            })

            reviewSuggestions.value = data || []
            reviewPanelVisible.value = true
        } catch (error) {
            console.error('AI Review error:', error)
            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: t('pages.admin.posts.ai_error'),
                life: 3000,
            })
        } finally {
            aiLoading.value.review = false
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
        rewriteContent,
        reviewContent,
        reviewSuggestions,
        reviewPanelVisible,
    }
}
