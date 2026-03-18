/* eslint-disable max-lines */
import { computed, ref, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
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

const TEXT_TRANSLATION_SCOPE_ORDER: TranslationTextField[] = ['title', 'summary', 'content']
const STREAM_MODE_MAX_CHARS = 4000
const MIN_CHUNK_SIZE = 200
const DIRECT_MODE_FIELDS: TranslationTextField[] = ['title', 'summary']

interface TranslationRunContext {
    source: PostTranslationSourceDetail
    sourceLanguage: string
    targetLanguage: string
    fields: TranslationTextField[]
}

interface TranslationFieldRuntime {
    sourceValue: string
    sourceChunks: string[]
    translatedChunks: string[]
    nextChunkIndex: number
    preferredMode: PostTranslationMode
    fallbackUsed: boolean
}

interface TranslationStreamChunk {
    content?: string
    chunk?: string
    delta?: string
    chunkIndex?: number
    totalChunks?: number
    isChunkComplete?: boolean
}

interface TranslateDirectResponseData {
    mode: 'direct' | 'task'
    content?: string
}

interface TranslateFieldOptions {
    sourceLanguage: string
    field: TranslationTextField
}

function createFieldProgress(): PostTranslationFieldProgress {
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

function createFieldProgressRecord(): Record<TranslationTextField, PostTranslationFieldProgress> {
    return {
        title: createFieldProgress(),
        summary: createFieldProgress(),
        content: createFieldProgress(),
    }
}

function isTextScope(field: TranslationScopeField): field is TranslationTextField {
    return TEXT_TRANSLATION_SCOPE_ORDER.includes(field as TranslationTextField)
}

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

    const markPendingFields = (fields: TranslationTextField[], startIndex = 0) => {
        fields.slice(startIndex).forEach((field) => {
            const current = translationProgress.value.fields[field]
            if (current.status !== 'completed') {
                setFieldProgress(field, {
                    status: 'pending',
                    error: null,
                    canRetry: false,
                    canCancel: false,
                    mode: current.mode,
                })
            }
        })
    }

    const resetActiveController = () => {
        activeAbortController = null
    }

    const createActiveController = () => {
        activeAbortController = new AbortController()
        return activeAbortController
    }

    const extractErrorFromResponse = async (response: Response) => {
        const responseText = await response.text().catch(() => '')
        if (!responseText) {
            return t('pages.admin.posts.ai_error')
        }

        try {
            const parsed = JSON.parse(responseText) as { message?: string, statusMessage?: string }
            return parsed.message || parsed.statusMessage || responseText
        } catch {
            return responseText
        }
    }

    const normalizeStreamChunk = (payload: unknown): TranslationStreamChunk => {
        if (typeof payload === 'string') {
            return { content: payload }
        }

        if (payload && typeof payload === 'object') {
            return payload as TranslationStreamChunk
        }

        return {}
    }

    const resolveChunkContent = (currentContent: string, chunk: TranslationStreamChunk) => {
        if (typeof chunk.content === 'string' && chunk.content.length > 0) {
            return chunk.content
        }

        if (typeof chunk.chunk === 'string' && chunk.chunk.length > 0) {
            return chunk.chunk
        }

        if (typeof chunk.delta === 'string' && chunk.delta.length > 0) {
            return `${currentContent}${chunk.delta}`
        }

        return currentContent
    }

    const parseSSEBlock = async (
        block: string,
        onChunk: (chunk: TranslationStreamChunk) => Promise<void> | void,
    ) => {
        const lines = block
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)

        if (lines.length === 0) {
            return false
        }

        let eventName = 'message'
        const dataLines: string[] = []

        for (const line of lines) {
            if (line.startsWith('event:')) {
                eventName = line.slice(6).trim() || 'message'
                continue
            }

            if (line.startsWith('data:')) {
                dataLines.push(line.slice(5).trim())
            }
        }

        if (eventName === 'end') {
            return true
        }

        const rawData = dataLines.join('\n')
        if (!rawData) {
            return false
        }

        let payload: unknown = rawData
        try {
            payload = JSON.parse(rawData)
        } catch {
            payload = rawData
        }

        if (eventName === 'error') {
            throw new Error(toErrorMessage(payload))
        }

        await onChunk(normalizeStreamChunk(payload))
        return false
    }

    const readTranslationStream = async (
        payload: {
            content: string
            targetLanguage: string
            sourceLanguage: string
            field: TranslationTextField
        },
        signal: AbortSignal,
        onChunk: (chunk: TranslationStreamChunk) => Promise<void> | void,
    ) => {
        const response = await fetch('/api/ai/translate.stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream',
            },
            body: JSON.stringify({
                content: payload.content,
                targetLanguage: payload.targetLanguage,
                sourceLanguage: payload.sourceLanguage,
                field: payload.field,
            }),
            signal,
        })

        if (!response.ok) {
            throw new Error(await extractErrorFromResponse(response))
        }

        if (!response.body) {
            throw new Error(t('pages.admin.posts.ai_error'))
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
            const { value, done } = await reader.read()
            buffer += decoder.decode(value || new Uint8Array(), { stream: !done })

            const blocks = buffer.split(/\r?\n\r?\n/)
            buffer = blocks.pop() || ''

            for (const block of blocks) {
                const shouldEnd = await parseSSEBlock(block, onChunk)
                if (shouldEnd) {
                    return
                }
            }

            if (done) {
                break
            }
        }

        if (buffer.trim()) {
            await parseSSEBlock(buffer, onChunk)
        }
    }

    const translateChunkViaStream = async (
        content: string,
        options: TranslateFieldOptions,
        signal: AbortSignal,
    ) => {
        const translatedChunks: string[] = []

        await readTranslationStream({
            content,
            targetLanguage: runContext.value?.targetLanguage || '',
            sourceLanguage: options.sourceLanguage,
            field: options.field,
        }, signal, (chunk) => {
            const nextIndex = typeof chunk.chunkIndex === 'number' ? chunk.chunkIndex : translatedChunks.length
            translatedChunks[nextIndex] = resolveChunkContent(translatedChunks[nextIndex] || '', chunk)
        })

        return translatedChunks.filter(Boolean).join('\n\n')
    }

    const executeDirectMode = async (
        field: TranslationTextField,
        runtime: TranslationFieldRuntime,
        options: TranslateFieldOptions,
    ) => {
        const response = await $fetch<ApiResponse<TranslateDirectResponseData>>('/api/ai/translate', {
            method: 'POST',
            body: {
                content: runtime.sourceValue,
                targetLanguage: runContext.value?.targetLanguage || '',
                sourceLanguage: options.sourceLanguage,
                field,
            },
        })

        if (response.data.mode !== 'direct' || typeof response.data.content !== 'string') {
            throw new Error(t('pages.admin.posts.ai_error'))
        }

        runtime.translatedChunks = [response.data.content]
        runtime.nextChunkIndex = runtime.sourceChunks.length

        syncFieldContent(field, runtime, {
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

    const executeChunkMode = async (
        field: TranslationTextField,
        runtime: TranslationFieldRuntime,
        options: TranslateFieldOptions,
    ) => {
        const controller = createActiveController()

        try {
            for (let index = runtime.nextChunkIndex; index < runtime.sourceChunks.length; index += 1) {
                const sourceChunk = runtime.sourceChunks[index]
                if (!sourceChunk) {
                    continue
                }

                const translatedChunk = await translateChunkViaStream(sourceChunk, options, controller.signal)
                runtime.translatedChunks[index] = translatedChunk
                runtime.nextChunkIndex = index + 1

                syncFieldContent(field, runtime, {
                    status: 'processing',
                    mode: 'chunk',
                    error: null,
                    canCancel: true,
                    canRetry: false,
                })
            }
        } finally {
            resetActiveController()
        }
    }

    const executeStreamMode = async (
        field: TranslationTextField,
        runtime: TranslationFieldRuntime,
        options: TranslateFieldOptions,
    ) => {
        const controller = createActiveController()

        try {
            await readTranslationStream({
                content: runtime.sourceValue,
                targetLanguage: runContext.value?.targetLanguage || '',
                sourceLanguage: options.sourceLanguage,
                field,
            }, controller.signal, (chunk) => {
                const nextIndex = typeof chunk.chunkIndex === 'number' ? chunk.chunkIndex : runtime.nextChunkIndex
                const nextContent = resolveChunkContent(runtime.translatedChunks[nextIndex] || '', chunk)
                const totalChunks = chunk.totalChunks || runtime.sourceChunks.length || 1
                const sourceChunk = runtime.sourceChunks[nextIndex] || runtime.sourceValue
                const isChunkComplete = chunk.isChunkComplete === true
                const chunkCompletionRatio = isChunkComplete
                    ? 1
                    : Math.min(nextContent.length / Math.max(sourceChunk.length, 1), 0.99)
                const committedChunks = isChunkComplete
                    ? Math.max(runtime.nextChunkIndex, nextIndex + 1)
                    : runtime.nextChunkIndex
                const visibleChunks = Math.max(committedChunks, nextIndex + 1)

                runtime.translatedChunks[nextIndex] = nextContent
                runtime.nextChunkIndex = committedChunks

                syncFieldContent(field, runtime, {
                    status: 'processing',
                    mode: totalChunks > 1 ? 'chunk' : 'stream',
                    totalChunks,
                    completedChunks: committedChunks,
                    progress: Math.round(((nextIndex + chunkCompletionRatio) / totalChunks) * 100),
                    error: null,
                    canCancel: true,
                    canRetry: false,
                }, visibleChunks)
            })
        } finally {
            resetActiveController()
        }
    }

    const finalizeField = (field: TranslationTextField, status: 'completed' | 'failed' | 'cancelled', error: string | null = null) => {
        setFieldProgress(field, {
            status,
            error,
            canRetry: status === 'failed' || status === 'cancelled',
            canCancel: false,
            progress: status === 'completed' ? 100 : translationProgress.value.fields[field].progress,
        })
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
                await executeDirectMode(field, runtime, options)
            } else if (preferredMode === 'stream') {
                try {
                    await executeStreamMode(field, runtime, options)
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
                        await executeChunkMode(field, runtime, options)
                    } else {
                        throw error
                    }
                }
            } else {
                await executeChunkMode(field, runtime, options)
            }

            finalizeField(field, 'completed')
        } catch (error) {
            if ((error as { name?: string } | null)?.name === 'AbortError') {
                finalizeField(field, 'cancelled')
                throw error
            }

            finalizeField(field, 'failed', toErrorMessage(error))
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
        markPendingFields(context.fields, startIndex)
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

    const cancelFieldTranslation = (field?: TranslationTextField) => {
        const activeField = translationProgress.value.activeField
        if (!activeField || (field && field !== activeField) || !activeAbortController) {
            return false
        }

        activeAbortController.abort()
        return true
    }

    const retryFieldTranslation = async (field: TranslationTextField) => {
        const context = runContext.value
        if (!context || isTranslating.value) {
            return false
        }

        const fieldIndex = context.fields.indexOf(field)
        const fieldState = translationProgress.value.fields[field]
        if (fieldIndex < 0 || (fieldState.status !== 'failed' && fieldState.status !== 'cancelled')) {
            return false
        }

        markPendingFields(context.fields, fieldIndex)
        return await runPipelineFrom(fieldIndex)
    }

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

        runContext.value = {
            source: options.source,
            sourceLanguage: options.sourceLanguage,
            targetLanguage: options.targetLanguage,
            fields: textScopes,
        }

        translationProgress.value = {
            status: 'pending',
            progress: 0,
            activeField: null,
            taskId: null,
            error: null,
            fields: createFieldProgressRecord(),
        }

        textScopes.forEach((field) => {
            let currentValue = post.value.content

            if (field === 'title') {
                currentValue = post.value.title
            } else if (field === 'summary') {
                currentValue = post.value.summary || ''
            }

            setFieldProgress(field, {
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
