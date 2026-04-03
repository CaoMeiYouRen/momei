import type { Ref } from 'vue'
import type { Composer } from 'vue-i18n'
import type { ApiResponse } from '@/types/api'
import type { PostEditorData } from '@/types/post-editor'
import type {
    PostTranslationFieldProgress,
    PostTranslationMode,
    PostTranslationProgress,
    PostTranslationSourceDetail,
    TranslationProgressField,
    TranslationScopeField,
    TranslationTextField,
} from '@/types/post-translation'
import { preserveMarkdownChunkBoundary } from '@/utils/shared/content-processor'
import {
    readTranslationStream,
    resolveTranslationChunkContent,
} from '@/composables/use-post-translation-ai.stream'

export const TEXT_TRANSLATION_SCOPE_ORDER: TranslationTextField[] = ['title', 'summary', 'content']
export const TRANSLATION_PIPELINE_SCOPE_ORDER: TranslationProgressField[] = ['title', 'summary', 'tags', 'content']

export interface TranslationRunContext {
    source: PostTranslationSourceDetail
    sourceLanguage: string
    targetLanguage: string
    fields: TranslationProgressField[]
    progressFields: TranslationProgressField[]
}

export interface TranslationFieldRuntime {
    sourceValue: string
    sourceChunks: string[]
    translatedChunks: string[]
    nextChunkIndex: number
    resumeTaskId: string | null
    resumeFailedTask: boolean
    preferredMode: PostTranslationMode
    fallbackUsed: boolean
}

export interface TranslateDirectResponseData {
    mode: 'direct' | 'task'
    content?: string
}

export interface TranslateFieldOptions {
    sourceLanguage: string
    field: TranslationTextField
}

export function createFieldProgress(): PostTranslationFieldProgress {
    return {
        status: 'idle',
        progress: 0,
        mode: null,
        content: '',
        completedChunks: 0,
        totalChunks: 0,
        error: null,
        canRetry: false,
        canCancel: false,
    }
}

export function createFieldProgressRecord(): Record<TranslationProgressField, PostTranslationFieldProgress> {
    return {
        title: createFieldProgress(),
        summary: createFieldProgress(),
        content: createFieldProgress(),
        tags: createFieldProgress(),
    }
}

export function isTextScope(field: TranslationScopeField): field is TranslationTextField {
    return TEXT_TRANSLATION_SCOPE_ORDER.includes(field as TranslationTextField)
}

export function isTranslationProgressTextField(field: TranslationProgressField): field is TranslationTextField {
    return TEXT_TRANSLATION_SCOPE_ORDER.includes(field as TranslationTextField)
}

export async function executeDirectTranslation(options: {
    field: TranslationTextField
    runtime: TranslationFieldRuntime
    translateOptions: TranslateFieldOptions
    targetLanguage: string
    t: Composer['t']
    syncFieldContent: (
        field: TranslationTextField,
        runtime: TranslationFieldRuntime,
        overrides?: Partial<PostTranslationFieldProgress>,
        visibleChunkCount?: number,
    ) => void
}) {
    const response = await $fetch<ApiResponse<TranslateDirectResponseData>>('/api/ai/translate', {
        method: 'POST',
        body: {
            content: options.runtime.sourceValue,
            targetLanguage: options.targetLanguage,
            sourceLanguage: options.translateOptions.sourceLanguage,
            field: options.field,
        },
    })

    if (response.data.mode !== 'direct' || typeof response.data.content !== 'string') {
        throw new Error(options.t('pages.admin.posts.ai_error'))
    }

    options.runtime.translatedChunks = [response.data.content]
    options.runtime.nextChunkIndex = options.runtime.sourceChunks.length

    options.syncFieldContent(options.field, options.runtime, {
        status: 'processing',
        mode: 'direct',
        totalChunks: 1,
        completedChunks: 1,
        progress: 100,
        error: null,
        canCancel: false,
        canRetry: false,
    }, 1)
}

export async function translateChunkViaStreamHelper(options: {
    content: string
    translateOptions: TranslateFieldOptions
    targetLanguage: string
    signal: AbortSignal
    t: Composer['t']
    toErrorMessage: (error: unknown) => string
}) {
    const translatedChunks: string[] = []

    await readTranslationStream({
        content: options.content,
        targetLanguage: options.targetLanguage,
        sourceLanguage: options.translateOptions.sourceLanguage,
        field: options.translateOptions.field,
    }, options.signal, (chunk) => {
        const nextIndex = typeof chunk.chunkIndex === 'number' ? chunk.chunkIndex : translatedChunks.length
        translatedChunks[nextIndex] = resolveTranslationChunkContent(translatedChunks[nextIndex] || '', chunk)
    }, {
        fallbackMessage: options.t('pages.admin.posts.ai_error'),
        toErrorMessage: options.toErrorMessage,
    })

    return preserveMarkdownChunkBoundary(options.content, translatedChunks.filter(Boolean).join(''))
}

export async function executeChunkTranslation(options: {
    field: TranslationTextField
    runtime: TranslationFieldRuntime
    translateOptions: TranslateFieldOptions
    createActiveController: () => AbortController
    resetActiveController: () => void
    syncFieldContent: (
        field: TranslationTextField,
        runtime: TranslationFieldRuntime,
        overrides?: Partial<PostTranslationFieldProgress>,
        visibleChunkCount?: number,
    ) => void
    translateChunkViaStream: (options: {
        content: string
        translateOptions: TranslateFieldOptions
        targetLanguage: string
        signal: AbortSignal
        t: Composer['t']
        toErrorMessage: (error: unknown) => string
    }) => Promise<string>
    targetLanguage: string
    t: Composer['t']
    toErrorMessage: (error: unknown) => string
}) {
    const controller = options.createActiveController()

    try {
        for (let index = options.runtime.nextChunkIndex; index < options.runtime.sourceChunks.length; index += 1) {
            const sourceChunk = options.runtime.sourceChunks[index]
            if (!sourceChunk) {
                continue
            }

            const translatedChunk = await options.translateChunkViaStream({
                content: sourceChunk,
                translateOptions: options.translateOptions,
                targetLanguage: options.targetLanguage,
                signal: controller.signal,
                t: options.t,
                toErrorMessage: options.toErrorMessage,
            })
            options.runtime.translatedChunks[index] = translatedChunk
            options.runtime.nextChunkIndex = index + 1

            options.syncFieldContent(options.field, options.runtime, {
                status: 'processing',
                mode: 'chunk',
                error: null,
                canCancel: true,
                canRetry: false,
            })
        }
    } finally {
        options.resetActiveController()
    }
}

export async function executeStreamingTranslation(options: {
    field: TranslationTextField
    runtime: TranslationFieldRuntime
    translateOptions: TranslateFieldOptions
    targetLanguage: string
    t: Composer['t']
    toErrorMessage: (error: unknown) => string
    createActiveController: () => AbortController
    resetActiveController: () => void
    syncFieldContent: (
        field: TranslationTextField,
        runtime: TranslationFieldRuntime,
        overrides?: Partial<PostTranslationFieldProgress>,
        visibleChunkCount?: number,
    ) => void
}) {
    const controller = options.createActiveController()

    try {
        await readTranslationStream({
            content: options.runtime.sourceValue,
            targetLanguage: options.targetLanguage,
            sourceLanguage: options.translateOptions.sourceLanguage,
            field: options.field,
        }, controller.signal, (chunk) => {
            const nextIndex = typeof chunk.chunkIndex === 'number' ? chunk.chunkIndex : options.runtime.nextChunkIndex
            const totalChunks = chunk.totalChunks || options.runtime.sourceChunks.length || 1
            const sourceChunk = options.runtime.sourceChunks[nextIndex] || options.runtime.sourceValue
            const isChunkComplete = chunk.isChunkComplete === true
            const resolvedContent = resolveTranslationChunkContent(options.runtime.translatedChunks[nextIndex] || '', chunk)
            const nextContent = isChunkComplete
                ? preserveMarkdownChunkBoundary(sourceChunk, resolvedContent)
                : resolvedContent
            const chunkCompletionRatio = isChunkComplete
                ? 1
                : Math.min(nextContent.length / Math.max(sourceChunk.length, 1), 0.99)
            const committedChunks = isChunkComplete
                ? Math.max(options.runtime.nextChunkIndex, nextIndex + 1)
                : options.runtime.nextChunkIndex
            const visibleChunks = Math.max(committedChunks, nextIndex + 1)

            options.runtime.translatedChunks[nextIndex] = nextContent
            options.runtime.nextChunkIndex = committedChunks

            options.syncFieldContent(options.field, options.runtime, {
                status: 'processing',
                mode: totalChunks > 1 ? 'chunk' : 'stream',
                totalChunks,
                completedChunks: committedChunks,
                progress: Math.round(((nextIndex + chunkCompletionRatio) / totalChunks) * 100),
                error: null,
                canCancel: true,
                canRetry: false,
            }, visibleChunks)
        }, {
            fallbackMessage: options.t('pages.admin.posts.ai_error'),
            toErrorMessage: options.toErrorMessage,
        })
    } finally {
        options.resetActiveController()
    }
}

export function finalizeTranslationField(options: {
    field: TranslationTextField
    status: 'completed' | 'failed' | 'cancelled'
    error?: string | null
    translationProgress: Ref<PostTranslationProgress>
    setFieldProgress: (field: TranslationTextField, patch: Partial<PostTranslationFieldProgress>) => void
}) {
    options.setFieldProgress(options.field, {
        status: options.status,
        error: options.error || null,
        canRetry: options.status === 'failed' || options.status === 'cancelled',
        canCancel: false,
        progress: options.status === 'completed' ? 100 : options.translationProgress.value.fields[options.field].progress,
    })
}

export function markPendingTranslationFields(options: {
    fields: TranslationProgressField[]
    startIndex: number
    translationProgress: Ref<PostTranslationProgress>
    setFieldProgress: (field: TranslationProgressField, patch: Partial<PostTranslationFieldProgress>) => void
}) {
    options.fields.slice(options.startIndex).forEach((field) => {
        const current = options.translationProgress.value.fields[field]
        if (current.status !== 'completed') {
            options.setFieldProgress(field, {
                status: 'pending',
                error: null,
                canRetry: false,
                canCancel: false,
                mode: current.mode,
            })
        }
    })
}

export function cancelActiveTranslation(options: {
    field?: TranslationTextField
    activeField: TranslationProgressField | null
    activeAbortController: AbortController | null
}) {
    if (!options.activeField || (options.field && options.field !== options.activeField) || !options.activeAbortController) {
        return false
    }

    options.activeAbortController.abort()
    return true
}

export function canRetryTranslationField(options: {
    field: TranslationTextField
    isTranslating: boolean
    runContext: Ref<TranslationRunContext | null>
    translationProgress: Ref<PostTranslationProgress>
}) {
    const context = options.runContext.value
    if (!context || options.isTranslating) {
        return null
    }

    const fieldIndex = context.fields.indexOf(options.field)
    const fieldState = options.translationProgress.value.fields[options.field]
    if (fieldIndex < 0 || (fieldState.status !== 'failed' && fieldState.status !== 'cancelled')) {
        return null
    }

    return fieldIndex
}

export function initializeTranslationRun(options: {
    runOptions: {
        source: PostTranslationSourceDetail
        sourceLanguage: string
        targetLanguage: string
        scopes: TranslationScopeField[]
    }
    post: Ref<PostEditorData>
    runContext: Ref<TranslationRunContext | null>
    translationProgress: Ref<PostTranslationProgress>
    setFieldProgress: (field: TranslationProgressField, patch: Partial<PostTranslationFieldProgress>) => void
    resetTranslationProgress: () => void
}) {
    const progressScopes = TRANSLATION_PIPELINE_SCOPE_ORDER.filter((scope) => options.runOptions.scopes.includes(scope))

    if (progressScopes.length === 0) {
        options.resetTranslationProgress()
        return false
    }

    options.runContext.value = {
        source: options.runOptions.source,
        sourceLanguage: options.runOptions.sourceLanguage,
        targetLanguage: options.runOptions.targetLanguage,
        fields: progressScopes,
        progressFields: progressScopes,
    }

    options.translationProgress.value = {
        status: 'pending',
        progress: 0,
        activeField: null,
        taskId: null,
        error: null,
        fields: createFieldProgressRecord(),
    }

    progressScopes.forEach((field) => {
        let currentValue = options.post.value.content

        if (field === 'title') {
            currentValue = options.post.value.title
        } else if (field === 'summary') {
            currentValue = options.post.value.summary || ''
        } else if (field === 'tags') {
            currentValue = options.post.value.tags.join(', ')
        }

        options.setFieldProgress(field, {
            status: 'pending',
            content: currentValue,
            progress: 0,
            mode: null,
            completedChunks: 0,
            totalChunks: 0,
            error: null,
            canRetry: false,
            canCancel: false,
        })
    })

    return true
}
