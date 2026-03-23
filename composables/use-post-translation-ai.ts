import { computed, ref, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { isTranslationStreamFallbackError } from './use-post-translation-ai.stream'
import {
    createFieldProgressRecord,
    cancelActiveTranslation,
    canRetryTranslationField,
    executeDirectTranslation,
    executeStreamingTranslation,
    finalizeTranslationField,
    initializeTranslationRun,
    isTextScope,
    markPendingTranslationFields,
    type TranslateFieldOptions,
    type TranslationFieldRuntime,
    type TranslationRunContext,
} from './use-post-translation-ai.helpers'
import {
    beginAuxiliaryProgressState,
    completeAuxiliaryProgressState,
    createActiveTranslationController,
    executeTaskModeTranslation,
    failAuxiliaryProgressState,
    getOrCreateFieldRuntime,
    getTranslationFieldSourceValue,
    notifyTranslationSuccessToast,
    patchTranslationProgressField,
    requestTranslatedTaxonomyName,
    requestTranslatedTaxonomyNames,
    resetActiveTranslationController,
    resetTranslationProgressState,
    runTranslationPipelineFromIndex,
    setTranslationFieldTargetValue,
    syncTranslationFieldContent,
    toTranslationErrorMessage,
    type TranslationControllerState,
} from './use-post-translation-ai.runtime'
import type { PostEditorData } from '@/types/post-editor'
import type {
    PostTranslationMode,
    PostTranslationProgress,
    PostTranslationSourceDetail,
    TranslationProgressField,
    TranslationScopeField,
    TranslationTextField,
} from '@/types/post-translation'

export function usePostTranslationAI(post: Ref<PostEditorData>) {
    const toast = useToast()
    const { t } = useI18n()
    const fieldRuntimes = new Map<TranslationTextField, TranslationFieldRuntime>()
    const runContext = ref<TranslationRunContext | null>(null)
    const controllerState: TranslationControllerState = {
        activeAbortController: null,
        activeRunId: 0,
    }

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
    const beginAuxiliaryFieldProgress = (field: Exclude<TranslationProgressField, TranslationTextField>, options: {
        content?: string
        totalChunks?: number
        mode?: PostTranslationMode | null
    } = {}) => beginAuxiliaryProgressState(runContext, translationProgress, field, options)

    const completeAuxiliaryFieldProgress = (field: Exclude<TranslationProgressField, TranslationTextField>, options: {
        content?: string
        totalChunks?: number
        completedChunks?: number
        mode?: PostTranslationMode | null
    } = {}) => {
        completeAuxiliaryProgressState(runContext, translationProgress, field, options)

        if (translationProgress.value.status === 'completed') {
            notifyTranslationSuccessToast(toast, t)
        }
    }

    const failAuxiliaryFieldProgress = (field: Exclude<TranslationProgressField, TranslationTextField>, options: {
        error: string
        content?: string
        totalChunks?: number
        completedChunks?: number
        mode?: PostTranslationMode | null
    }) => failAuxiliaryProgressState(runContext, translationProgress, field, options)

    const translateField = async (field: TranslationTextField, options: TranslateFieldOptions) => {
        const context = runContext.value
        if (!context) {
            return
        }

        const sourceValue = getTranslationFieldSourceValue(context.source, field)
        if (!sourceValue.trim()) {
            patchTranslationProgressField(runContext, translationProgress, field, {
                status: 'completed',
                progress: 100,
                error: null,
                canRetry: false,
                canCancel: false,
            })
            return
        }

        const runtime = getOrCreateFieldRuntime(fieldRuntimes, field, sourceValue)
        const preferredMode = runtime.preferredMode

        if (runtime.nextChunkIndex === 0) {
            runtime.translatedChunks = []
            setTranslationFieldTargetValue(post, field, '')
        }

        patchTranslationProgressField(runContext, translationProgress, field, {
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
                    syncFieldContent: (nextField, nextRuntime, overrides, visibleChunkCount) => syncTranslationFieldContent({
                        post,
                        runContext,
                        translationProgress,
                        field: nextField,
                        runtime: nextRuntime,
                        overrides,
                        visibleChunkCount,
                    }),
                })
            } else if (preferredMode === 'task') {
                await executeTaskModeTranslation({
                    field,
                    runtime,
                    translateOptions: options,
                    controllerState,
                    post,
                    runContext,
                    translationProgress,
                    t,
                })
            } else if (preferredMode === 'stream') {
                try {
                    await executeStreamingTranslation({
                        field,
                        runtime,
                        translateOptions: options,
                        targetLanguage: runContext.value?.targetLanguage || '',
                        t,
                        toErrorMessage: (error) => toTranslationErrorMessage(t, error),
                        createActiveController: () => createActiveTranslationController(controllerState),
                        resetActiveController: () => resetActiveTranslationController(controllerState),
                        syncFieldContent: (nextField, nextRuntime, overrides, visibleChunkCount) => syncTranslationFieldContent({
                            post,
                            runContext,
                            translationProgress,
                            field: nextField,
                            runtime: nextRuntime,
                            overrides,
                            visibleChunkCount,
                        }),
                    })
                } catch (error) {
                    const hasNoAppliedChunk = runtime.nextChunkIndex === completedBeforeExecution
                    if ((error as { name?: string } | null)?.name !== 'AbortError' && hasNoAppliedChunk && !runtime.fallbackUsed) {
                        runtime.fallbackUsed = true
                        if (isTranslationStreamFallbackError(error) && error.fallbackMode === 'task') {
                            runtime.preferredMode = 'task'
                            toast.add({
                                severity: 'warn',
                                summary: t('common.warn'),
                                detail: t('pages.admin.posts.translation_workflow.task_fallback'),
                                life: 3000,
                            })
                        } else {
                            toast.add({
                                severity: 'warn',
                                summary: t('common.warn'),
                                detail: t('pages.admin.posts.translation_workflow.stream_fallback'),
                                life: 3000,
                            })
                        }

                        await executeTaskModeTranslation({
                            field,
                            runtime,
                            translateOptions: options,
                            controllerState,
                            post,
                            runContext,
                            translationProgress,
                            t,
                        })
                    } else {
                        throw error
                    }
                }
            }

            finalizeTranslationField({
                field,
                status: 'completed',
                translationProgress,
                setFieldProgress: (nextField, patch) => patchTranslationProgressField(runContext, translationProgress, nextField, patch),
            })
        } catch (error) {
            if ((error as { name?: string } | null)?.name === 'AbortError') {
                finalizeTranslationField({
                    field,
                    status: 'cancelled',
                    translationProgress,
                    setFieldProgress: (nextField, patch) => patchTranslationProgressField(runContext, translationProgress, nextField, patch),
                })
                throw error
            }

            finalizeTranslationField({
                field,
                status: 'failed',
                error: toTranslationErrorMessage(t, error),
                translationProgress,
                setFieldProgress: (nextField, patch) => patchTranslationProgressField(runContext, translationProgress, nextField, patch),
            })
            throw error
        }
    }

    const runPipelineFrom = async (startIndex: number) => {
        if (!runContext.value) {
            resetTranslationProgressState(controllerState, runContext, translationProgress, fieldRuntimes)
            return false
        }

        return await runTranslationPipelineFromIndex({
            startIndex,
            controllerState,
            runContext,
            translationProgress,
            translateField,
            t,
            toast,
        })
    }

    const resetTranslationProgress = () => {
        resetTranslationProgressState(controllerState, runContext, translationProgress, fieldRuntimes)
    }

    const translateTaxonomyName = requestTranslatedTaxonomyName

    const translateTaxonomyNames = requestTranslatedTaxonomyNames

    const cancelFieldTranslation = (field?: TranslationTextField) => cancelActiveTranslation({
        field,
        activeField: translationProgress.value.activeField,
        activeAbortController: controllerState.activeAbortController,
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

        const runtime = fieldRuntimes.get(field)
        const fieldState = translationProgress.value.fields[field]
        if (runtime && fieldState.mode === 'task' && translationProgress.value.taskId) {
            runtime.resumeTaskId = translationProgress.value.taskId
            runtime.resumeFailedTask = true
        }

        markPendingTranslationFields({
            fields: runContext.value.fields,
            startIndex: fieldIndex,
            translationProgress,
            setFieldProgress: (nextField, patch) => patchTranslationProgressField(runContext, translationProgress, nextField, patch),
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
            setFieldProgress: (field, patch) => patchTranslationProgressField(runContext, translationProgress, field, patch),
            resetTranslationProgress,
        })
        if (!initialized) {
            return true
        }

        return await runPipelineFrom(0)
    }

    return {
        beginAuxiliaryFieldProgress,
        cancelFieldTranslation,
        completeAuxiliaryFieldProgress,
        failAuxiliaryFieldProgress,
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
