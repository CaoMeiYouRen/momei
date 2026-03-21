import { computed, ref, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import {
    createFieldProgressRecord,
    cancelActiveTranslation,
    canRetryTranslationField,
    executeChunkTranslation,
    executeDirectTranslation,
    executeStreamingTranslation,
    finalizeTranslationField,
    initializeTranslationRun,
    isTextScope,
    markPendingTranslationFields,
    translateChunkViaStreamHelper,
    type TranslateFieldOptions,
    type TranslationFieldRuntime,
    type TranslationRunContext,
} from './use-post-translation-ai.helpers'
import type { ApiResponse } from '@/types/api'
import type { PostEditorData } from '@/types/post-editor'
import type {
    PostTranslationFieldProgress,
    PostTranslationMode,
    PostTranslationProgress,
    PostTranslationSourceDetail,
    TranslationScopeField,
    TranslationTextField,
} from '@/types/post-translation'
import { ContentProcessor } from '@/utils/shared/content-processor'
import { AI_TEXT_DIRECT_RETURN_MAX_CHARS } from '@/utils/shared/env'

const STREAM_MODE_MAX_CHARS = 4000
const MIN_CHUNK_SIZE = 200
const DIRECT_MODE_FIELDS: TranslationTextField[] = ['title', 'summary']

export function usePostTranslationAI(post: Ref<PostEditorData>) {
    const toast = useToast()
    const { t } = useI18n()
    const fieldRuntimes = new Map<TranslationTextField, TranslationFieldRuntime>()
    const runContext = ref<TranslationRunContext | null>(null)
    let activeAbortController: AbortController | null = null
    let activeRunId = 0

    const translationProgress = ref<PostTranslationProgress>({
        status: 'idle',
        progress: 0,
        activeField: null,
        taskId: null,
        error: null,
        fields: createFieldProgressRecord(),
    })
    const isTranslating = computed(() =>
        translationProgress.value.status === 'pending'
        || translationProgress.value.status === 'processing',
    )
    const toErrorMessage = (error: unknown) => {
        if ((error as { name?: string } | null)?.name === 'AbortError') {
            return t('pages.admin.posts.translation_workflow.cancelled')
        }

        if (error instanceof Error) {
            return error.message
        }

        return t('pages.admin.posts.ai_error')
    }

    const getFieldSourceValue = (source: PostTranslationSourceDetail, field: TranslationTextField) => {
        if (field === 'title') {
            return source.title || ''
        }

        if (field === 'summary') {
            return source.summary || ''
        }

        return source.content || ''
    }

    const setFieldTargetValue = (field: TranslationTextField, value: string) => {
        if (field === 'title') {
            post.value.title = value
            return
        }

        if (field === 'summary') {
            post.value.summary = value
            return
        }

        post.value.content = value
    }

    const resolveSourceChunks = (sourceValue: string) => {
        const chunks = ContentProcessor.splitMarkdown(sourceValue, {
            chunkSize: STREAM_MODE_MAX_CHARS,
            minChunkSize: MIN_CHUNK_SIZE,
        })

        return chunks.length > 0 ? chunks : [sourceValue]
    }

    const resolvePreferredMode = (field: TranslationTextField, sourceValue: string): PostTranslationMode => {
        if (DIRECT_MODE_FIELDS.includes(field) && sourceValue.length <= AI_TEXT_DIRECT_RETURN_MAX_CHARS) {
            return 'direct'
        }

        return 'stream'
    }

    const getFieldRuntime = (field: TranslationTextField, sourceValue: string) => {
        const cachedRuntime = fieldRuntimes.get(field)
        if (cachedRuntime?.sourceValue === sourceValue) {
            return cachedRuntime
        }

        const sourceChunks = resolveSourceChunks(sourceValue)
        const runtime: TranslationFieldRuntime = {
            sourceValue,
            sourceChunks,
            translatedChunks: [],
            nextChunkIndex: 0,
            preferredMode: resolvePreferredMode(field, sourceValue),
            fallbackUsed: false,
        }

        fieldRuntimes.set(field, runtime)
        return runtime
    }

    const updateOverallProgress = () => {
        const fields = runContext.value?.fields || []

        if (fields.length === 0) {
            translationProgress.value = {
                ...translationProgress.value,
                status: 'idle',
                progress: 0,
                activeField: null,
                error: null,
            }
            return
        }

        const fieldStates = fields.map((field) => translationProgress.value.fields[field])
        const activeField = fields.find((field) => translationProgress.value.fields[field].status === 'processing')
            || fields.find((field) => translationProgress.value.fields[field].status === 'failed')
            || fields.find((field) => translationProgress.value.fields[field].status === 'cancelled')
            || null
        const progress = Math.round(fieldStates.reduce((sum, state) => sum + state.progress, 0) / fields.length)

        let status: PostTranslationProgress['status'] = 'idle'
        if (fieldStates.some((state) => state.status === 'processing' || state.status === 'pending')) {
            status = fieldStates.some((state) => state.status === 'processing') ? 'processing' : 'pending'
        } else if (fieldStates.every((state) => state.status === 'completed')) {
            status = 'completed'
        } else if (fieldStates.some((state) => state.status === 'failed')) {
            status = 'failed'
        } else if (fieldStates.some((state) => state.status === 'cancelled')) {
            status = 'cancelled'
        }

        translationProgress.value = {
            ...translationProgress.value,
            status,
            progress,
            activeField,
            error: activeField ? translationProgress.value.fields[activeField].error : null,
        }
    }

    const setFieldProgress = (field: TranslationTextField, patch: Partial<PostTranslationFieldProgress>) => {
        translationProgress.value = {
            ...translationProgress.value,
            fields: {
                ...translationProgress.value.fields,
                [field]: {
                    ...translationProgress.value.fields[field],
                    ...patch,
                },
            },
        }

        updateOverallProgress()
    }

    const syncFieldContent = (
        field: TranslationTextField,
        runtime: TranslationFieldRuntime,
        overrides: Partial<PostTranslationFieldProgress> = {},
        visibleChunkCount = runtime.nextChunkIndex,
    ) => {
        const content = runtime.translatedChunks
            .slice(0, Math.max(visibleChunkCount, runtime.nextChunkIndex))
            .filter(Boolean)
            .join('\n\n')

        setFieldTargetValue(field, content)
        setFieldProgress(field, {
            content,
            completedChunks: runtime.nextChunkIndex,
            totalChunks: runtime.sourceChunks.length,
            progress: runtime.sourceChunks.length > 0
                ? Math.round((runtime.nextChunkIndex / runtime.sourceChunks.length) * 100)
                : 100,
            ...overrides,
        })
    }

    const resetActiveController = () => {
        activeAbortController = null
    }

    const createActiveController = () => {
        activeAbortController = new AbortController()
        return activeAbortController
    }

    const translateField = async (field: TranslationTextField, options: TranslateFieldOptions) => {
        const context = runContext.value
        if (!context) {
            return
        }

        const sourceValue = getFieldSourceValue(context.source, field)
        if (!sourceValue.trim()) {
            setFieldProgress(field, {
                status: 'completed',
                progress: 100,
                error: null,
                canRetry: false,
                canCancel: false,
            })
            return
        }

        const runtime = getFieldRuntime(field, sourceValue)
        const preferredMode = runtime.nextChunkIndex > 0 && runtime.preferredMode !== 'direct'
            ? 'chunk'
            : runtime.preferredMode

        if (runtime.nextChunkIndex === 0) {
            runtime.translatedChunks = []
            setFieldTargetValue(field, '')
        }

        setFieldProgress(field, {
            status: 'processing',
            progress: runtime.sourceChunks.length > 0
                ? Math.round((runtime.nextChunkIndex / runtime.sourceChunks.length) * 100)
                : 0,
            mode: preferredMode,
            totalChunks: runtime.sourceChunks.length,
            completedChunks: runtime.nextChunkIndex,
            error: null,
            canRetry: false,
            canCancel: true,
        })

        const completedBeforeExecution = runtime.nextChunkIndex

        try {
            if (preferredMode === 'direct') {
                await executeDirectTranslation({
                    field,
                    runtime,
                    translateOptions: options,
                    targetLanguage: runContext.value?.targetLanguage || '',
                    t,
                    syncFieldContent,
                })
            } else if (preferredMode === 'stream') {
                try {
                    await executeStreamingTranslation({
                        field,
                        runtime,
                        translateOptions: options,
                        targetLanguage: runContext.value?.targetLanguage || '',
                        t,
                        toErrorMessage,
                        createActiveController,
                        resetActiveController,
                        syncFieldContent,
                    })
                } catch (error) {
                    const hasNoAppliedChunk = runtime.nextChunkIndex === completedBeforeExecution
                    if ((error as { name?: string } | null)?.name !== 'AbortError' && hasNoAppliedChunk && !runtime.fallbackUsed) {
                        runtime.fallbackUsed = true
                        toast.add({
                            severity: 'warn',
                            summary: t('common.warn'),
                            detail: t('pages.admin.posts.translation_workflow.stream_fallback'),
                            life: 3000,
                        })
                        await executeChunkTranslation({
                            field,
                            runtime,
                            translateOptions: options,
                            createActiveController,
                            resetActiveController,
                            syncFieldContent,
                            translateChunkViaStream: translateChunkViaStreamHelper,
                            targetLanguage: runContext.value?.targetLanguage || '',
                            t,
                            toErrorMessage,
                        })
                    } else {
                        throw error
                    }
                }
            } else {
                await executeChunkTranslation({
                    field,
                    runtime,
                    translateOptions: options,
                    createActiveController,
                    resetActiveController,
                    syncFieldContent,
                    translateChunkViaStream: translateChunkViaStreamHelper,
                    targetLanguage: runContext.value?.targetLanguage || '',
                    t,
                    toErrorMessage,
                })
            }

            finalizeTranslationField({
                field,
                status: 'completed',
                translationProgress,
                setFieldProgress,
            })
        } catch (error) {
            if ((error as { name?: string } | null)?.name === 'AbortError') {
                finalizeTranslationField({
                    field,
                    status: 'cancelled',
                    translationProgress,
                    setFieldProgress,
                })
                throw error
            }

            finalizeTranslationField({
                field,
                status: 'failed',
                error: toErrorMessage(error),
                translationProgress,
                setFieldProgress,
            })
            throw error
        }
    }

    const runPipelineFrom = async (startIndex: number) => {
        const context = runContext.value
        if (!context) {
            resetTranslationProgress()
            return false
        }

        activeRunId += 1
        const runId = activeRunId
        markPendingTranslationFields({
            fields: context.fields,
            startIndex,
            translationProgress,
            setFieldProgress,
        })
        updateOverallProgress()

        try {
            for (let index = startIndex; index < context.fields.length; index += 1) {
                if (runId !== activeRunId) {
                    return false
                }

                const field = context.fields[index]
                if (!field) {
                    continue
                }

                await translateField(field, {
                    sourceLanguage: context.sourceLanguage,
                    field,
                })
            }

            translationProgress.value = {
                ...translationProgress.value,
                status: 'completed',
                progress: 100,
                activeField: null,
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
            if ((error as { name?: string } | null)?.name === 'AbortError') {
                translationProgress.value = {
                    ...translationProgress.value,
                    status: 'cancelled',
                }
                updateOverallProgress()
                return false
            }

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

    const resetTranslationProgress = () => {
        activeRunId += 1
        activeAbortController?.abort()
        resetActiveController()
        runContext.value = null
        fieldRuntimes.clear()
        translationProgress.value = {
            status: 'idle',
            progress: 0,
            activeField: null,
            taskId: null,
            error: null,
            fields: createFieldProgressRecord(),
        }
    }

    const translateTaxonomyName = async (name: string, targetLanguage: string) => {
        const response = await $fetch<ApiResponse<string>>('/api/ai/translate-name', {
            method: 'POST',
            body: {
                name,
                targetLanguage,
            },
        })

        return response.data || ''
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

        return response.data || []
    }

    const cancelFieldTranslation = (field?: TranslationTextField) => cancelActiveTranslation({
        field,
        activeField: translationProgress.value.activeField,
        activeAbortController,
    })

    const retryFieldTranslation = async (field: TranslationTextField) => {
        const fieldIndex = canRetryTranslationField({
            field,
            isTranslating: isTranslating.value,
            runContext,
            translationProgress,
        })
        if (fieldIndex === null || !runContext.value) {
            return false
        }

        markPendingTranslationFields({
            fields: runContext.value.fields,
            startIndex: fieldIndex,
            translationProgress,
            setFieldProgress,
        })
        return await runPipelineFrom(fieldIndex)
    }

    const translatePostFields = async (options: {
        source: PostTranslationSourceDetail
        sourceLanguage: string
        targetLanguage: string
        scopes: TranslationScopeField[]
    }) => {
        const initialized = initializeTranslationRun({
            runOptions: options,
            post,
            runContext,
            translationProgress,
            setFieldProgress,
            resetTranslationProgress,
        })
        if (!initialized) {
            return true
        }

        return await runPipelineFrom(0)
    }

    return {
        cancelFieldTranslation,
        isTextScope,
        isTranslating,
        resetTranslationProgress,
        retryFieldTranslation,
        translateTaxonomyName,
        translateTaxonomyNames,
        translatePostFields,
        translationProgress,
    }
}
