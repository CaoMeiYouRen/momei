import { computed, ref, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import type { ApiResponse } from '@/types/api'
import type { PostEditorData } from '@/types/post-editor'
import type {
    PostTranslationProgress,
    PostTranslationSourceDetail,
    TranslationScopeField,
    TranslationTextField,
} from '@/types/post-translation'

const MIN_TASK_POLLING_INTERVAL = 10000
const TEXT_TRANSLATION_SCOPE_ORDER: TranslationTextField[] = ['title', 'summary', 'content']

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

interface TranslateFieldOptions {
    sourceLanguage: string
    field: TranslationTextField
    stepIndex: number
    totalSteps: number
}

function isTextScope(field: TranslationScopeField): field is TranslationTextField {
    return TEXT_TRANSLATION_SCOPE_ORDER.includes(field as TranslationTextField)
}

export function usePostTranslationAI(post: Ref<PostEditorData>) {
    const toast = useToast()
    const { t } = useI18n()

    const translationProgress = ref<PostTranslationProgress>({
        status: 'idle',
        progress: 0,
        activeField: null,
        taskId: null,
        error: null,
    })

    const isTranslating = computed(() =>
        translationProgress.value.status === 'pending'
        || translationProgress.value.status === 'processing',
    )

    const setProgress = (options: {
        field: TranslationTextField
        stepIndex: number
        totalSteps: number
        localProgress: number
        status: PostTranslationProgress['status']
        taskId?: string | null
    }) => {
        const completedRatio = options.stepIndex / options.totalSteps
        const currentRatio = Math.min(1, Math.max(0, options.localProgress / 100)) / options.totalSteps

        translationProgress.value = {
            ...translationProgress.value,
            status: options.status,
            progress: Math.min(100, Math.max(0, Math.round((completedRatio + currentRatio) * 100))),
            activeField: options.field,
            taskId: options.taskId ?? translationProgress.value.taskId,
        }
    }

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

    const toErrorMessage = (error: unknown) => {
        if (error instanceof Error) {
            return error.message
        }

        return t('pages.admin.posts.ai_error')
    }

    const resetTranslationProgress = () => {
        translationProgress.value = {
            status: 'idle',
            progress: 0,
            activeField: null,
            taskId: null,
            error: null,
        }
    }

    const waitForTranslationTask = async (
        taskId: string,
        options: TranslateFieldOptions,
    ) => await new Promise<string>((resolve, reject) => {
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
                const response = await $fetch<ApiResponse<AITaskStatusPayload>>(
                    `/api/ai/task/status/${taskId}`,
                )
                const task = response.data

                setProgress({
                    field: options.field,
                    stepIndex: options.stepIndex,
                    totalSteps: options.totalSteps,
                    localProgress: task.progress,
                    status: task.status,
                    taskId,
                })

                if (task.status === 'completed') {
                    finalize(() => resolve(extractTranslatedContent(task.result)))
                    return
                }

                if (task.status === 'failed') {
                    finalize(() => reject(new Error(task.error || t('pages.admin.posts.ai_error'))))
                }
            } catch (error) {
                finalize(() => reject(error instanceof Error ? error : new Error(t('pages.admin.posts.ai_error'))))
            } finally {
                requestInFlight = false
            }
        }

        const intervalId = window.setInterval(() => {
            void pollTask()
        }, MIN_TASK_POLLING_INTERVAL)

        pollingController.stop = () => window.clearInterval(intervalId)
        void pollTask()
    })

    const requestTranslatedText = async (
        content: string,
        targetLanguage: string,
        options: TranslateFieldOptions,
    ) => {
        const response = await $fetch<ApiResponse<TranslateApiResult>>('/api/ai/translate', {
            method: 'POST',
            body: {
                content,
                targetLanguage,
                sourceLanguage: options.sourceLanguage,
                field: options.field,
            },
        })

        const result = response.data
        if (typeof result === 'string') {
            setProgress({
                field: options.field,
                stepIndex: options.stepIndex,
                totalSteps: options.totalSteps,
                localProgress: 100,
                status: 'processing',
                taskId: null,
            })
            return result
        }

        if (result.mode === 'direct') {
            setProgress({
                field: options.field,
                stepIndex: options.stepIndex,
                totalSteps: options.totalSteps,
                localProgress: 100,
                status: 'processing',
                taskId: null,
            })
            return result.content
        }

        return await waitForTranslationTask(result.taskId, options)
    }

    const translateTaxonomyName = async (name: string, targetLanguage: string) => {
        const response = await $fetch<ApiResponse<string>>('/api/ai/translate-name', {
            method: 'POST',
            body: {
                name,
                targetLanguage,
            },
        })

        return response.data
    }

    const translateTaxonomyNames = async (names: string[], targetLanguage: string) => {
        if (names.length === 0) {
            return []
        }

        const response = await $fetch<ApiResponse<string[]>>('/api/ai/translate-name', {
            method: 'POST',
            body: {
                names,
                targetLanguage,
            },
        })

        return response.data
    }

    const translateTitle = async (title: string, targetLanguage: string) => await translateTaxonomyName(title, targetLanguage)

    const translatePostFields = async (options: {
        source: PostTranslationSourceDetail
        sourceLanguage: string
        targetLanguage: string
        scopes: TranslationScopeField[]
    }) => {
        const textScopes = TEXT_TRANSLATION_SCOPE_ORDER.filter((scope) => options.scopes.includes(scope))

        if (textScopes.length === 0) {
            resetTranslationProgress()
            return true
        }

        translationProgress.value = {
            status: 'processing',
            progress: 0,
            activeField: textScopes[0] || null,
            taskId: null,
            error: null,
        }

        try {
            for (const [index, field] of textScopes.entries()) {
                setProgress({
                    field,
                    stepIndex: index,
                    totalSteps: textScopes.length,
                    localProgress: 0,
                    status: 'processing',
                    taskId: null,
                })

                if (field === 'title') {
                    if (options.source.title?.trim()) {
                        post.value.title = await translateTitle(options.source.title, options.targetLanguage)
                    }

                    setProgress({
                        field,
                        stepIndex: index + 1,
                        totalSteps: textScopes.length,
                        localProgress: 0,
                        status: 'processing',
                        taskId: null,
                    })
                    continue
                }

                const sourceValue = field === 'summary'
                    ? options.source.summary
                    : options.source.content

                if (!sourceValue?.trim()) {
                    setProgress({
                        field,
                        stepIndex: index + 1,
                        totalSteps: textScopes.length,
                        localProgress: 0,
                        status: 'processing',
                        taskId: null,
                    })
                    continue
                }

                const translatedValue = await requestTranslatedText(sourceValue, options.targetLanguage, {
                    sourceLanguage: options.sourceLanguage,
                    field,
                    stepIndex: index,
                    totalSteps: textScopes.length,
                })

                if (field === 'summary') {
                    post.value.summary = translatedValue
                } else {
                    post.value.content = translatedValue
                }

                setProgress({
                    field,
                    stepIndex: index + 1,
                    totalSteps: textScopes.length,
                    localProgress: 0,
                    status: 'processing',
                    taskId: null,
                })
            }

            translationProgress.value = {
                status: 'completed',
                progress: 100,
                activeField: null,
                taskId: null,
                error: null,
            }

            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('pages.admin.posts.translate_success'),
                life: 3000,
            })

            return true
        } catch (error) {
            translationProgress.value = {
                ...translationProgress.value,
                status: 'failed',
                error: toErrorMessage(error),
            }

            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: toErrorMessage(error),
                life: 4000,
            })

            return false
        }
    }

    return {
        isTextScope,
        isTranslating,
        resetTranslationProgress,
        translateTaxonomyName,
        translateTaxonomyNames,
        translatePostFields,
        translationProgress,
    }
}
