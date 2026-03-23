import type { Ref } from 'vue'
import type { Composer } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import {
    createFieldProgressRecord,
    markPendingTranslationFields,
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
    TranslationProgressField,
    TranslationTextField,
} from '@/types/post-translation'
import { ContentProcessor } from '@/utils/shared/content-processor'
import { AI_TEXT_DIRECT_RETURN_MAX_CHARS } from '@/utils/shared/env'

const STREAM_MODE_MAX_CHARS = 4000
const MIN_CHUNK_SIZE = 200
const DIRECT_MODE_FIELDS: TranslationTextField[] = ['title', 'summary']
const TRANSLATION_TASK_POLL_INTERVAL_MS = 1500

export interface TranslationControllerState {
    activeAbortController: AbortController | null
    activeRunId: number
}

export function notifyTranslationSuccessToast(
    toast: ReturnType<typeof useToast>,
    t: Composer['t'],
) {
    toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('pages.admin.posts.translate_success'),
        life: 3000,
    })
}

export function toTranslationErrorMessage(t: Composer['t'], error: unknown) {
    if ((error as { name?: string } | null)?.name === 'AbortError') {
        return t('pages.admin.posts.translation_workflow.cancelled')
    }

    if (error instanceof Error) {
        return error.message
    }

    return t('pages.admin.posts.ai_error')
}

export function getTranslationFieldSourceValue(source: PostTranslationSourceDetail, field: TranslationTextField) {
    if (field === 'title') {
        return source.title || ''
    }

    if (field === 'summary') {
        return source.summary || ''
    }

    return source.content || ''
}

export function setTranslationFieldTargetValue(post: Ref<PostEditorData>, field: TranslationTextField, value: string) {
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

function resolveTranslationSourceChunks(sourceValue: string) {
    const chunks = ContentProcessor.splitMarkdownLossless(sourceValue, {
        chunkSize: STREAM_MODE_MAX_CHARS,
        minChunkSize: MIN_CHUNK_SIZE,
    })

    return chunks.length > 0 ? chunks : [sourceValue]
}

function resolveTranslationPreferredMode(field: TranslationTextField, sourceValue: string): PostTranslationMode {
    if (DIRECT_MODE_FIELDS.includes(field) && sourceValue.length <= AI_TEXT_DIRECT_RETURN_MAX_CHARS) {
        return 'direct'
    }

    return 'stream'
}

export function getOrCreateFieldRuntime(
    fieldRuntimes: Map<TranslationTextField, TranslationFieldRuntime>,
    field: TranslationTextField,
    sourceValue: string,
) {
    const cachedRuntime = fieldRuntimes.get(field)
    if (cachedRuntime?.sourceValue === sourceValue) {
        return cachedRuntime
    }

    const runtime: TranslationFieldRuntime = {
        sourceValue,
        sourceChunks: resolveTranslationSourceChunks(sourceValue),
        translatedChunks: [],
        nextChunkIndex: 0,
        resumeTaskId: null,
        resumeFailedTask: false,
        preferredMode: resolveTranslationPreferredMode(field, sourceValue),
        fallbackUsed: false,
    }

    fieldRuntimes.set(field, runtime)
    return runtime
}

export function updateOverallTranslationProgress(
    runContext: Ref<TranslationRunContext | null>,
    translationProgress: Ref<PostTranslationProgress>,
) {
    const fields = runContext.value?.progressFields || []

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

export function patchTranslationProgressField(
    runContext: Ref<TranslationRunContext | null>,
    translationProgress: Ref<PostTranslationProgress>,
    field: TranslationProgressField,
    patch: Partial<PostTranslationFieldProgress>,
) {
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

    updateOverallTranslationProgress(runContext, translationProgress)
}

export function beginAuxiliaryProgressState(
    runContext: Ref<TranslationRunContext | null>,
    translationProgress: Ref<PostTranslationProgress>,
    field: Exclude<TranslationProgressField, TranslationTextField>,
    options: {
        content?: string
        totalChunks?: number
        mode?: PostTranslationMode | null
    } = {},
) {
    patchTranslationProgressField(runContext, translationProgress, field, {
        status: 'processing',
        progress: 0,
        mode: options.mode ?? 'direct',
        content: options.content ?? translationProgress.value.fields[field].content,
        completedChunks: 0,
        totalChunks: options.totalChunks ?? 0,
        error: null,
        canRetry: false,
        canCancel: false,
    })
}

export function completeAuxiliaryProgressState(
    runContext: Ref<TranslationRunContext | null>,
    translationProgress: Ref<PostTranslationProgress>,
    field: Exclude<TranslationProgressField, TranslationTextField>,
    options: {
        content?: string
        totalChunks?: number
        completedChunks?: number
        mode?: PostTranslationMode | null
    } = {},
) {
    patchTranslationProgressField(runContext, translationProgress, field, {
        status: 'completed',
        progress: 100,
        mode: options.mode ?? translationProgress.value.fields[field].mode,
        content: options.content ?? translationProgress.value.fields[field].content,
        completedChunks: options.completedChunks ?? options.totalChunks ?? translationProgress.value.fields[field].completedChunks,
        totalChunks: options.totalChunks ?? translationProgress.value.fields[field].totalChunks,
        error: null,
        canRetry: false,
        canCancel: false,
    })
}

export function failAuxiliaryProgressState(
    runContext: Ref<TranslationRunContext | null>,
    translationProgress: Ref<PostTranslationProgress>,
    field: Exclude<TranslationProgressField, TranslationTextField>,
    options: {
        error: string
        content?: string
        totalChunks?: number
        completedChunks?: number
        mode?: PostTranslationMode | null
    },
) {
    patchTranslationProgressField(runContext, translationProgress, field, {
        status: 'failed',
        progress: translationProgress.value.fields[field].progress,
        mode: options.mode ?? translationProgress.value.fields[field].mode,
        content: options.content ?? translationProgress.value.fields[field].content,
        completedChunks: options.completedChunks ?? translationProgress.value.fields[field].completedChunks,
        totalChunks: options.totalChunks ?? translationProgress.value.fields[field].totalChunks,
        error: options.error,
        canRetry: false,
        canCancel: false,
    })
}

export function syncTranslationFieldContent(options: {
    post: Ref<PostEditorData>
    runContext: Ref<TranslationRunContext | null>
    translationProgress: Ref<PostTranslationProgress>
    field: TranslationTextField
    runtime: TranslationFieldRuntime
    overrides?: Partial<PostTranslationFieldProgress>
    visibleChunkCount?: number
}) {
    const content = options.runtime.translatedChunks
        .slice(0, Math.max(options.visibleChunkCount ?? options.runtime.nextChunkIndex, options.runtime.nextChunkIndex))
        .filter(Boolean)
        .join('')

    setTranslationFieldTargetValue(options.post, options.field, content)
    patchTranslationProgressField(options.runContext, options.translationProgress, options.field, {
        content,
        completedChunks: options.runtime.nextChunkIndex,
        totalChunks: options.runtime.sourceChunks.length,
        progress: options.runtime.sourceChunks.length > 0
            ? Math.round((options.runtime.nextChunkIndex / options.runtime.sourceChunks.length) * 100)
            : 100,
        ...(options.overrides ?? {}),
    })
}

export function resetActiveTranslationController(controllerState: TranslationControllerState) {
    controllerState.activeAbortController = null
}

export function createActiveTranslationController(controllerState: TranslationControllerState) {
    controllerState.activeAbortController = new AbortController()
    return controllerState.activeAbortController
}

async function delayWithAbort(timeoutMs: number, signal: AbortSignal) {
    await new Promise<void>((resolve, reject) => {
        const onAbort = () => {
            clearTimeout(timeoutId)
            reject(new DOMException('Aborted', 'AbortError'))
        }

        const timeoutId = setTimeout(() => {
            signal.removeEventListener('abort', onAbort)
            resolve()
        }, timeoutMs)

        if (signal.aborted) {
            onAbort()
            return
        }

        signal.addEventListener('abort', onAbort, { once: true })
    })
}

export async function pollTranslationTaskStatus(options: {
    field: TranslationTextField
    runtime: TranslationFieldRuntime
    taskId: string
    signal: AbortSignal
    resumeFailed?: boolean
    post: Ref<PostEditorData>
    runContext: Ref<TranslationRunContext | null>
    translationProgress: Ref<PostTranslationProgress>
    t: Composer['t']
}) {
    while (true) {
        const response = await $fetch<ApiResponse<{
            status: 'pending' | 'processing' | 'completed' | 'failed'
            progress: number
            error?: string | null
            result?: {
                mode?: string
                content?: string
                completedChunks?: number
                totalChunks?: number
                lastError?: string | null
            }
        }>>(`/api/ai/task/status/${options.taskId}`, {
            query: options.resumeFailed ? { resumeFailed: 'true' } : undefined,
            signal: options.signal,
        })

        const task = response.data
        const taskResult = task.result
        const content = typeof taskResult?.content === 'string' ? taskResult.content : ''
        const completedChunks = typeof taskResult?.completedChunks === 'number'
            ? taskResult.completedChunks
            : options.runtime.nextChunkIndex
        const totalChunks = typeof taskResult?.totalChunks === 'number'
            ? taskResult.totalChunks
            : options.runtime.sourceChunks.length || 1

        options.runtime.nextChunkIndex = Math.min(completedChunks, totalChunks)

        setTranslationFieldTargetValue(options.post, options.field, content)
        patchTranslationProgressField(options.runContext, options.translationProgress, options.field, {
            status: 'processing',
            mode: 'task',
            content,
            progress: task.progress,
            completedChunks,
            totalChunks,
            error: task.error || taskResult?.lastError || null,
            canRetry: false,
            canCancel: false,
        })

        if (task.status === 'completed') {
            options.runtime.resumeTaskId = null
            options.runtime.resumeFailedTask = false
            options.translationProgress.value = {
                ...options.translationProgress.value,
                taskId: null,
            }
            return content
        }

        if (task.status === 'failed') {
            throw new Error(task.error || taskResult?.lastError || options.t('pages.admin.posts.ai_error'))
        }

        await delayWithAbort(TRANSLATION_TASK_POLL_INTERVAL_MS, options.signal)
    }
}

export async function requestTaskOrDirectTranslation(options: {
    field: TranslationTextField
    runtime: TranslationFieldRuntime
    translateOptions: TranslateFieldOptions
    signal: AbortSignal
    post: Ref<PostEditorData>
    runContext: Ref<TranslationRunContext | null>
    translationProgress: Ref<PostTranslationProgress>
    t: Composer['t']
}) {
    const response = await $fetch<ApiResponse<{
        mode: 'direct' | 'task'
        content?: string
        taskId?: string
    }>>('/api/ai/translate', {
        method: 'POST',
        body: {
            content: options.runtime.sourceValue,
            targetLanguage: options.runContext.value?.targetLanguage || '',
            sourceLanguage: options.translateOptions.sourceLanguage,
            field: options.field,
        },
        signal: options.signal,
    })

    if (response.data.mode === 'direct' && typeof response.data.content === 'string') {
        options.runtime.resumeTaskId = null
        options.runtime.resumeFailedTask = false
        options.runtime.translatedChunks = [response.data.content]
        options.runtime.nextChunkIndex = options.runtime.sourceChunks.length
        syncTranslationFieldContent({
            post: options.post,
            runContext: options.runContext,
            translationProgress: options.translationProgress,
            field: options.field,
            runtime: options.runtime,
            overrides: {
                status: 'processing',
                mode: 'direct',
                totalChunks: 1,
                completedChunks: 1,
                progress: 100,
                error: null,
                canCancel: false,
                canRetry: false,
            },
            visibleChunkCount: 1,
        })
        return
    }

    if (response.data.mode === 'task' && response.data.taskId) {
        options.translationProgress.value = {
            ...options.translationProgress.value,
            taskId: response.data.taskId,
        }
        options.runtime.resumeTaskId = response.data.taskId
        options.runtime.preferredMode = 'task'
        await pollTranslationTaskStatus({
            field: options.field,
            runtime: options.runtime,
            taskId: response.data.taskId,
            signal: options.signal,
            post: options.post,
            runContext: options.runContext,
            translationProgress: options.translationProgress,
            t: options.t,
        })
        return
    }

    throw new Error(options.t('pages.admin.posts.ai_error'))
}

export async function executeTaskModeTranslation(options: {
    field: TranslationTextField
    runtime: TranslationFieldRuntime
    translateOptions: TranslateFieldOptions
    controllerState: TranslationControllerState
    post: Ref<PostEditorData>
    runContext: Ref<TranslationRunContext | null>
    translationProgress: Ref<PostTranslationProgress>
    t: Composer['t']
}) {
    const controller = createActiveTranslationController(options.controllerState)
    const existingTaskId = options.translationProgress.value.taskId
    const existingFieldState = options.translationProgress.value.fields[options.field]
    const resumableTaskId = options.runtime.resumeTaskId
        || (existingTaskId && existingFieldState.mode === 'task' ? existingTaskId : null)
    const resumeFailedTask = options.runtime.resumeFailedTask

    try {
        if (resumableTaskId) {
            options.runtime.resumeTaskId = resumableTaskId
            options.runtime.resumeFailedTask = false
            options.runtime.preferredMode = 'task'
            await pollTranslationTaskStatus({
                field: options.field,
                runtime: options.runtime,
                taskId: resumableTaskId,
                signal: controller.signal,
                resumeFailed: resumeFailedTask,
                post: options.post,
                runContext: options.runContext,
                translationProgress: options.translationProgress,
                t: options.t,
            })
            return
        }

        await requestTaskOrDirectTranslation({
            field: options.field,
            runtime: options.runtime,
            translateOptions: options.translateOptions,
            signal: controller.signal,
            post: options.post,
            runContext: options.runContext,
            translationProgress: options.translationProgress,
            t: options.t,
        })
    } finally {
        resetActiveTranslationController(options.controllerState)
    }
}

export async function runTranslationPipelineFromIndex(options: {
    startIndex: number
    controllerState: TranslationControllerState
    runContext: Ref<TranslationRunContext | null>
    translationProgress: Ref<PostTranslationProgress>
    translateField: (field: TranslationTextField, translateOptions: TranslateFieldOptions) => Promise<void>
    t: Composer['t']
    toast: ReturnType<typeof useToast>
}) {
    const context = options.runContext.value
    if (!context) {
        return false
    }

    options.controllerState.activeRunId += 1
    const runId = options.controllerState.activeRunId
    markPendingTranslationFields({
        fields: context.fields,
        startIndex: options.startIndex,
        translationProgress: options.translationProgress,
        setFieldProgress: (field, patch) => patchTranslationProgressField(options.runContext, options.translationProgress, field, patch),
    })
    updateOverallTranslationProgress(options.runContext, options.translationProgress)

    try {
        for (let index = options.startIndex; index < context.fields.length; index += 1) {
            if (runId !== options.controllerState.activeRunId) {
                return false
            }

            const field = context.fields[index]
            if (!field) {
                continue
            }

            await options.translateField(field, {
                sourceLanguage: context.sourceLanguage,
                field,
            })
        }

        updateOverallTranslationProgress(options.runContext, options.translationProgress)

        if (options.translationProgress.value.status === 'completed') {
            notifyTranslationSuccessToast(options.toast, options.t)
        }

        return true
    } catch (error) {
        if ((error as { name?: string } | null)?.name === 'AbortError') {
            options.translationProgress.value = {
                ...options.translationProgress.value,
                status: 'cancelled',
            }
            updateOverallTranslationProgress(options.runContext, options.translationProgress)
            return false
        }

        options.translationProgress.value = {
            ...options.translationProgress.value,
            status: 'failed',
            error: toTranslationErrorMessage(options.t, error),
        }

        options.toast.add({
            severity: 'error',
            summary: options.t('common.error'),
            detail: toTranslationErrorMessage(options.t, error),
            life: 4000,
        })

        return false
    }
}

export function resetTranslationProgressState(
    controllerState: TranslationControllerState,
    runContext: Ref<TranslationRunContext | null>,
    translationProgress: Ref<PostTranslationProgress>,
    fieldRuntimes: Map<TranslationTextField, TranslationFieldRuntime>,
) {
    controllerState.activeRunId += 1
    controllerState.activeAbortController?.abort()
    resetActiveTranslationController(controllerState)
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

export async function requestTranslatedTaxonomyName(name: string, targetLanguage: string) {
    const response = await $fetch<ApiResponse<string>>('/api/ai/translate-name', {
        method: 'POST',
        body: {
            name,
            targetLanguage,
        },
    })

    return response.data || ''
}

export async function requestTranslatedTaxonomyNames(names: string[], targetLanguage: string) {
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
