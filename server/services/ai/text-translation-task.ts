import { AIBaseService } from './base'
import { requestTranslation, type TranslateRequestOptions } from './text-translation'
import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import { calculateQuotaUnits, deriveChargeStatus, inferFailureStage } from '@/server/utils/ai/cost-governance'
import { isServerlessEnvironment } from '@/server/utils/env'
import logger from '@/server/utils/logger'
import { ContentProcessor } from '@/utils/shared/content-processor'
import {
    AI_MAX_CONTENT_LENGTH,
    AI_TEXT_TASK_CHUNK_SIZE,
    AI_TEXT_TASK_CONCURRENCY,
} from '@/utils/shared/env'
import type { AIUsageSnapshot } from '@/types/ai'

const SERVERLESS_TRANSLATION_TASK_CHUNK_SIZE = 2000
const SERVERLESS_TRANSLATION_TASK_STEP_CHUNKS = 1
const MAX_TRANSLATION_TASK_FAILURES = 3
const TRANSLATION_TASK_CHUNK_LEASE_MS = 30_000

interface TranslateTaskPayload {
    content: string
    to: string
    sourceLanguage?: string
    field?: TranslateRequestOptions['field']
    chunkSize: number
    concurrency: number
}

interface TranslateTaskState {
    mode: 'task'
    content: string
    translatedChunks: string[]
    completedChunks: number
    totalChunks: number
    nextChunkIndex: number
    activeChunkIndex: number | null
    leaseExpiresAt: string | null
    chunkSize: number
    concurrency: number
    targetLanguage: string
    sourceLanguage?: string
    field?: TranslateRequestOptions['field']
    lastError: string | null
    failureCount: number
    usageSnapshot?: AIUsageSnapshot
}

function parseJSON<T>(value: string | null | undefined, fallback: T): T {
    if (!value) {
        return fallback
    }

    try {
        return JSON.parse(value) as T
    } catch {
        return fallback
    }
}

function resolveTranslateTaskChunkSize() {
    if (isServerlessEnvironment()) {
        return Math.min(AI_TEXT_TASK_CHUNK_SIZE, SERVERLESS_TRANSLATION_TASK_CHUNK_SIZE)
    }

    return AI_TEXT_TASK_CHUNK_SIZE
}

function mergeUsageSnapshot(
    current: AIUsageSnapshot | undefined,
    next: { promptTokens?: number, completionTokens?: number, totalTokens?: number } | undefined,
    inputChars: number,
    outputChars: number,
): AIUsageSnapshot {
    return {
        requestCount: (current?.requestCount || 0) + 1,
        promptTokens: (current?.promptTokens || 0) + (next?.promptTokens || 0),
        completionTokens: (current?.completionTokens || 0) + (next?.completionTokens || 0),
        totalTokens: (current?.totalTokens || 0) + (next?.totalTokens || 0),
        textChars: inputChars,
        outputChars,
    }
}

function serializeTranslateTaskState(state: TranslateTaskState) {
    return {
        mode: state.mode,
        content: state.content,
        translatedChunks: state.translatedChunks,
        completedChunks: state.completedChunks,
        totalChunks: state.totalChunks,
        nextChunkIndex: state.nextChunkIndex,
        activeChunkIndex: state.activeChunkIndex,
        leaseExpiresAt: state.leaseExpiresAt,
        chunkSize: state.chunkSize,
        concurrency: state.concurrency,
        targetLanguage: state.targetLanguage,
        sourceLanguage: state.sourceLanguage,
        field: state.field,
        lastError: state.lastError,
        failureCount: state.failureCount,
        usageSnapshot: state.usageSnapshot,
    }
}

function buildTranslateTaskState(payload: TranslateTaskPayload, persisted?: Partial<TranslateTaskState>) {
    const chunks = ContentProcessor.splitMarkdown(payload.content, {
        chunkSize: Math.max(200, payload.chunkSize),
        minChunkSize: Math.min(200, Math.max(200, payload.chunkSize)),
    })
    const normalizedChunks = chunks.length > 0 ? chunks : [payload.content]
    const translatedChunks = Array.from({ length: normalizedChunks.length }, (_, index) => persisted?.translatedChunks?.[index] || '')
    const completedChunks = translatedChunks.filter(Boolean).length
    const nextChunkIndex = Math.min(
        typeof persisted?.nextChunkIndex === 'number' ? persisted.nextChunkIndex : completedChunks,
        normalizedChunks.length,
    )

    return {
        chunks: normalizedChunks,
        state: {
            mode: 'task' as const,
            content: translatedChunks.filter(Boolean).join('\n\n'),
            translatedChunks,
            completedChunks,
            totalChunks: normalizedChunks.length,
            nextChunkIndex,
            activeChunkIndex: typeof persisted?.activeChunkIndex === 'number' ? persisted.activeChunkIndex : null,
            leaseExpiresAt: typeof persisted?.leaseExpiresAt === 'string' ? persisted.leaseExpiresAt : null,
            chunkSize: payload.chunkSize,
            concurrency: payload.concurrency,
            targetLanguage: payload.to,
            sourceLanguage: payload.sourceLanguage,
            field: payload.field,
            lastError: persisted?.lastError || null,
            failureCount: persisted?.failureCount || 0,
            usageSnapshot: persisted?.usageSnapshot,
        },
    }
}

function calculateTaskProgress(state: TranslateTaskState) {
    if (state.totalChunks <= 0) {
        return 100
    }

    if (state.completedChunks >= state.totalChunks) {
        return 100
    }

    return Math.min(99, Math.round((state.completedChunks / state.totalChunks) * 100))
}

function hasActiveChunkLease(state: TranslateTaskState) {
    if (typeof state.activeChunkIndex !== 'number' || !state.leaseExpiresAt) {
        return false
    }

    const leaseExpiresAt = new Date(state.leaseExpiresAt).getTime()
    return Number.isFinite(leaseExpiresAt) && leaseExpiresAt > Date.now()
}

async function claimTranslateTaskChunk(taskRepo: ReturnType<typeof dataSource.getRepository<AITask>>, task: AITask, state: TranslateTaskState) {
    const claimedState: TranslateTaskState = {
        ...state,
        activeChunkIndex: state.activeChunkIndex ?? state.nextChunkIndex,
        leaseExpiresAt: new Date(Date.now() + TRANSLATION_TASK_CHUNK_LEASE_MS).toISOString(),
        lastError: null,
    }
    const previousResult = task.result
    const claimedResult = JSON.stringify(serializeTranslateTaskState(claimedState))
    const updateResult = await taskRepo.update({
        id: task.id,
        result: previousResult,
    }, {
        status: 'processing',
        error: null,
        result: claimedResult,
        progress: Math.max(task.progress || 0, calculateTaskProgress(claimedState)),
        startedAt: task.startedAt || new Date(),
    })

    if (updateResult.affected !== 1) {
        return null
    }

    task.result = claimedResult
    task.status = 'processing'
    task.error = null
    task.progress = Math.max(task.progress || 0, calculateTaskProgress(claimedState))
    task.startedAt = task.startedAt || new Date()

    return claimedState
}

export class TextTranslationTaskService extends AIBaseService {
    static async createTranslateTask(content: string, to: string, userId: string, options?: TranslateRequestOptions) {
        if (content.length > AI_MAX_CONTENT_LENGTH) {
            throw createError({
                statusCode: 413,
                message: 'Content too long',
            })
        }

        const payload: TranslateTaskPayload = {
            content,
            to,
            sourceLanguage: options?.sourceLanguage,
            field: options?.field,
            chunkSize: resolveTranslateTaskChunkSize(),
            concurrency: AI_TEXT_TASK_CONCURRENCY,
        }
        const { state } = buildTranslateTaskState(payload)
        const estimatedQuotaUnits = calculateQuotaUnits({
            category: 'text',
            type: 'translate',
            payload,
        })

        await this.assertQuotaAllowance({
            userId,
            category: 'text',
            type: 'translate',
            payload,
            estimatedQuotaUnits,
        })

        const task = await this.recordTask({
            userId,
            category: 'text',
            type: 'translate',
            status: 'pending',
            payload,
            response: serializeTranslateTaskState(state),
            textLength: content.length,
            progress: 0,
            estimatedQuotaUnits,
            chargeStatus: deriveChargeStatus({
                status: 'pending',
                quotaUnits: estimatedQuotaUnits,
                settlementSource: 'estimated',
            }),
            settlementSource: 'estimated',
        })

        if (!task) {
            throw new Error('Failed to create AI task')
        }

        return task
    }

    static async continueTranslateTask(
        taskId: string,
        userId: string,
        options: {
            isAdmin?: boolean
            allowFailedResume?: boolean
        } = {},
    ) {
        const taskRepo = dataSource.getRepository(AITask)
        const task = options.isAdmin
            ? await taskRepo.findOneBy({ id: taskId })
            : await taskRepo.findOneBy({ id: taskId, userId })
        if (!task) {
            return null
        }

        if (task.type !== 'translate' || task.status === 'completed') {
            return task
        }

        if (task.status === 'failed' && !options.allowFailedResume) {
            return task
        }

        const payload = parseJSON<TranslateTaskPayload>(task.payload, {
            content: '',
            to: '',
            chunkSize: resolveTranslateTaskChunkSize(),
            concurrency: AI_TEXT_TASK_CONCURRENCY,
        })
        const persistedState = parseJSON<Partial<TranslateTaskState>>(task.result, {})
        const { chunks, state } = buildTranslateTaskState(payload, persistedState)

        if (state.completedChunks >= state.totalChunks) {
            task.status = 'completed'
            task.progress = 100
            task.result = JSON.stringify(serializeTranslateTaskState(state))
            task.error = null
            task.completedAt = task.completedAt || new Date()
            return await taskRepo.save(task)
        }

        if (hasActiveChunkLease(state)) {
            return task
        }

        const maxChunksPerStep = isServerlessEnvironment()
            ? SERVERLESS_TRANSLATION_TASK_STEP_CHUNKS
            : Math.max(1, Math.min(payload.concurrency || 1, state.totalChunks))

        try {
            task.status = 'processing'
            task.startedAt = task.startedAt || new Date()
            task.error = null
            task.result = JSON.stringify(serializeTranslateTaskState(state))
            task.progress = Math.max(task.progress || 0, calculateTaskProgress(state))
            await taskRepo.save(task)

            let lastProvider = task.provider
            let lastModel = task.model

            for (let step = 0; step < maxChunksPerStep && state.nextChunkIndex < state.totalChunks; step += 1) {
                const claimedState = await claimTranslateTaskChunk(taskRepo, task, state)
                if (!claimedState) {
                    return options.isAdmin
                        ? await taskRepo.findOneBy({ id: taskId })
                        : await taskRepo.findOneBy({ id: taskId, userId })
                }

                state.activeChunkIndex = claimedState.activeChunkIndex
                state.leaseExpiresAt = claimedState.leaseExpiresAt

                const currentIndex = state.activeChunkIndex ?? state.nextChunkIndex
                const currentChunk = chunks[currentIndex]

                if (!currentChunk) {
                    state.nextChunkIndex = currentIndex + 1
                    state.activeChunkIndex = null
                    state.leaseExpiresAt = null
                    continue
                }

                const { provider, response, translatedContent } = await requestTranslation(
                    currentChunk,
                    payload.to,
                    undefined,
                    {
                        sourceLanguage: payload.sourceLanguage,
                        field: payload.field,
                    },
                )

                lastProvider = provider.name
                lastModel = response.model
                state.translatedChunks[currentIndex] = translatedContent
                state.nextChunkIndex = currentIndex + 1
                state.activeChunkIndex = null
                state.leaseExpiresAt = null
                state.completedChunks = state.translatedChunks.filter(Boolean).length
                state.content = state.translatedChunks.filter(Boolean).join('\n\n')
                state.lastError = null
                state.failureCount = 0
                state.usageSnapshot = mergeUsageSnapshot(
                    state.usageSnapshot,
                    response.usage,
                    payload.content.length,
                    state.content.length,
                )

                task.provider = lastProvider
                task.model = lastModel
                task.result = JSON.stringify(serializeTranslateTaskState(state))
                task.progress = calculateTaskProgress(state)
                task.error = null
                await taskRepo.save(task)
            }

            if (state.completedChunks >= state.totalChunks) {
                const quotaUnits = calculateQuotaUnits({
                    category: 'text',
                    type: 'translate',
                    usageSnapshot: state.usageSnapshot,
                })

                return await this.recordTask({
                    id: taskId,
                    userId: task.userId,
                    category: 'text',
                    type: 'translate',
                    status: 'completed',
                    provider: lastProvider || task.provider,
                    model: lastModel || task.model,
                    payload,
                    response: serializeTranslateTaskState(state),
                    progress: 100,
                    textLength: payload.content.length,
                    quotaUnits,
                    usageSnapshot: state.usageSnapshot,
                    settlementSource: 'actual',
                })
            }

            task.status = 'processing'
            task.result = JSON.stringify(serializeTranslateTaskState(state))
            task.progress = calculateTaskProgress(state)
            task.error = null
            return await taskRepo.save(task)
        } catch (error) {
            state.lastError = error instanceof Error ? error.message : String(error)
            state.failureCount += 1
            state.activeChunkIndex = null
            state.leaseExpiresAt = null
            task.result = JSON.stringify(serializeTranslateTaskState(state))
            task.progress = calculateTaskProgress(state)
            task.error = state.lastError

            if (state.failureCount >= MAX_TRANSLATION_TASK_FAILURES) {
                await this.recordTask({
                    id: taskId,
                    userId: task.userId,
                    category: 'text',
                    type: 'translate',
                    payload,
                    response: serializeTranslateTaskState(state),
                    error,
                    progress: calculateTaskProgress(state),
                    textLength: payload.content.length,
                    failureStage: inferFailureStage(error),
                    usageSnapshot: state.usageSnapshot,
                    settlementSource: 'estimated',
                })

                return await taskRepo.findOneBy({ id: taskId })
            }

            task.status = 'processing'
            await taskRepo.save(task)
            logger.warn(`[TextTranslationTaskService] Translation task ${taskId} will retry automatically`, error)
            return task
        }
    }
}
