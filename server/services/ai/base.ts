import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import {
    calculateQuotaUnits,
    deriveChargeStatus,
    inferFailureStage,
    normalizeTaskCategory,
    normalizeUsageSnapshot,
    serializeUsageSnapshot,
} from '@/server/utils/ai/cost-governance'
import { assertAIQuotaAllowance } from '@/server/services/ai/quota-governance'
import logger from '@/server/utils/logger'
import type { AICategory, AIChargeStatus, AIFailureStage, AIUsageSnapshot } from '@/types/ai'

function parseTaskResult(taskResult: string | null | undefined): unknown {
    if (!taskResult) {
        return null
    }

    try {
        return JSON.parse(taskResult)
    } catch {
        return taskResult
    }
}

function stripRawFromTaskResult(taskResult: unknown): unknown {
    if (!taskResult || typeof taskResult !== 'object' || Array.isArray(taskResult)) {
        return taskResult
    }

    const { raw: _raw, ...rest } = taskResult as Record<string, unknown>
    return rest
}

function resolveTaskAudioUrl(taskResult: unknown): string | null {
    if (!taskResult || typeof taskResult !== 'object' || Array.isArray(taskResult)) {
        return null
    }

    const resultRecord = taskResult as Record<string, unknown>
    const audioUrl = resultRecord.audioUrl ?? resultRecord.url
    return typeof audioUrl === 'string' ? audioUrl : null
}

/**
 * 序列化 payload
 */
function serializePayload(payload: unknown): string {
    if (!payload) {
        return '{}'
    }
    if (typeof payload === 'string') {
        return payload
    }
    return JSON.stringify(payload)
}

export abstract class AIBaseService {
    protected static async assertQuotaAllowance(options: {
        userId?: string
        userRole?: string | null
        category?: string | null
        type: string
        payload?: unknown
        estimatedQuotaUnits?: number
        estimatedCost?: number
    }) {
        await assertAIQuotaAllowance(options)
    }

    /**
     * 获取任务状态
     */
    static serializeTaskStatus(
        task: Pick<AITask, 'id' | 'status' | 'progress' | 'result' | 'error' | 'updatedAt'>,
        options: {
            includeRaw?: boolean
        } = {},
    ) {
        const response = {
            id: task.id,
            status: task.status,
            progress: task.progress || 0,
            error: task.error,
            updatedAt: task.updatedAt,
        }

        if (task.status !== 'completed') {
            return response
        }

        const parsedResult = parseTaskResult(task.result)
        const result = options.includeRaw ? parsedResult : stripRawFromTaskResult(parsedResult)

        return {
            ...response,
            result,
            audioUrl: resolveTaskAudioUrl(result),
        }
    }

    static async getTaskStatus(
        taskId: string,
        userId: string,
        options: {
            isAdmin?: boolean
            includeRaw?: boolean
        } = {},
    ) {
        const repo = dataSource.getRepository(AITask)
        const task = options.isAdmin
            ? await repo.findOneBy({ id: taskId })
            : await repo.findOneBy({ id: taskId, userId })

        if (!task) {
            throw createError({
                statusCode: 404,
                message: 'Task not found',
            })
        }

        return this.serializeTaskStatus(task, {
            includeRaw: options.includeRaw,
        })
    }

    /**
     * 记录 AI 任务到数据库
     */
    protected static async recordTask(options: {
        id?: string
        userId: string | undefined
        type: string
        category: AICategory
        status?: 'pending' | 'processing' | 'completed' | 'failed'
        provider?: string
        model?: string
        payload?: any
        response?: any
        error?: any
        postId?: string
        audioDuration?: number
        audioSize?: number
        textLength?: number
        language?: string
        cost?: number
        estimatedCost?: number
        progress?: number
        estimatedQuotaUnits?: number
        quotaUnits?: number
        usageSnapshot?: AIUsageSnapshot
        chargeStatus?: AIChargeStatus
        failureStage?: AIFailureStage
        settlementSource?: 'estimated' | 'actual'
        startedAt?: Date | null
        completedAt?: Date | null
        durationMs?: number
    }) {
        const {
            id,
            userId,
            type,
            category,
            provider,
            model,
            status,
            payload,
            response,
            error,
            postId,
            audioDuration,
            audioSize,
            textLength,
            language,
            cost,
            estimatedCost,
            progress,
            estimatedQuotaUnits,
            quotaUnits,
            usageSnapshot,
            chargeStatus,
            failureStage,
            settlementSource,
            startedAt,
            completedAt,
            durationMs,
        } = options
        if (!userId) {
            return
        }
        try {
            const repo = dataSource.getRepository(AITask)
            let result: string | undefined
            if (response) {
                result = typeof response === 'string' ? response : JSON.stringify(response)
            }

            let task: AITask | null = null
            if (id) {
                task = await repo.findOneBy({ id, userId })
            }

            if (!task) {
                task = repo.create({
                    id,
                    userId,
                    category: normalizeTaskCategory(category, type),
                    type,
                    payload: serializePayload(payload),
                })
            }

            const nextStatus = status || (error ? 'failed' : 'completed')
            const normalizedCategory = normalizeTaskCategory(category || task.category, type)
            const derivedUsageSnapshot = usageSnapshot || normalizeUsageSnapshot({
                category: normalizedCategory,
                type,
                payload,
                response,
                audioDuration,
                audioSize,
                textLength,
            })
            const derivedEstimatedQuotaUnits = estimatedQuotaUnits ?? calculateQuotaUnits({
                category: normalizedCategory,
                type,
                payload,
            })
            const derivedQuotaUnits = quotaUnits ?? calculateQuotaUnits({
                category: normalizedCategory,
                type,
                usageSnapshot: derivedUsageSnapshot,
                payload,
            })
            const resolvedFailureStage = failureStage ?? (error ? inferFailureStage(error) : task.failureStage)
            const resolvedChargeStatus = chargeStatus ?? deriveChargeStatus({
                status: nextStatus,
                failureStage: resolvedFailureStage,
                settlementSource,
                quotaUnits: derivedQuotaUnits || derivedEstimatedQuotaUnits,
            })

            let errorMsg = task.error
            if (error) {
                errorMsg = error.message || String(error)
            } else if (status) {
                // If status is provided but no error, we probably want to clear old error or keep it
                // Logic check: if status is 'completed' or 'processing', we might want to clear error
                if (status === 'completed' || status === 'processing') {
                    errorMsg = null
                }
            }

            const now = new Date()
            let resolvedStartedAt = startedAt
            if (startedAt === undefined) {
                resolvedStartedAt = nextStatus === 'processing' ? (task.startedAt || now) : task.startedAt
            }

            let resolvedCompletedAt = completedAt
            if (completedAt === undefined) {
                resolvedCompletedAt = nextStatus === 'completed' || nextStatus === 'failed' ? now : task.completedAt
            }

            const resolvedDurationMs = durationMs
                ?? (resolvedStartedAt && resolvedCompletedAt ? resolvedCompletedAt.getTime() - resolvedStartedAt.getTime() : task.durationMs)

            Object.assign(task, {
                category: normalizedCategory,
                type,
                provider: provider ?? task.provider,
                model: model ?? task.model,
                status: nextStatus,
                payload: payload ? serializePayload(payload) : task.payload,
                result: result || task.result,
                error: errorMsg,
                postId: postId ?? task.postId,
                audioDuration: audioDuration ?? task.audioDuration,
                audioSize: audioSize ?? task.audioSize,
                textLength: textLength ?? task.textLength,
                language: language ?? task.language,
                estimatedCost: estimatedCost ?? task.estimatedCost,
                actualCost: cost ?? task.actualCost,
                estimatedQuotaUnits: derivedEstimatedQuotaUnits ?? task.estimatedQuotaUnits,
                quotaUnits: resolvedChargeStatus === 'waived' ? 0 : (derivedQuotaUnits ?? task.quotaUnits),
                chargeStatus: resolvedChargeStatus,
                failureStage: resolvedFailureStage ?? null,
                usageSnapshot: serializeUsageSnapshot(derivedUsageSnapshot) ?? task.usageSnapshot,
                progress: progress ?? task.progress,
                startedAt: resolvedStartedAt ?? task.startedAt,
                completedAt: resolvedCompletedAt ?? task.completedAt,
                durationMs: resolvedDurationMs ?? task.durationMs,
            })

            return await repo.save(task)
        } catch (e) {
            logger.error(`[AIBaseService] Failed to record AI task (${type}):`, e)
        }
    }

    /**
     * 记录 AI 使用日志
     */
    protected static logUsage(options: {
        task: string
        response: any
        userId?: string
    }) {
        const { task, response, userId } = options
        const { model, usage } = response
        if (usage) {
            logger.info(
                `[AIUsage] task=${task}, model=${model}, userId=${userId || 'anonymous'}, promptTokens=${usage.promptTokens}, completionTokens=${usage.completionTokens}, totalTokens=${usage.totalTokens}`,
            )
        } else {
            logger.info(
                `[AIUsage] task=${task}, model=${model}, userId=${userId || 'anonymous'}, usage=unknown`,
            )
        }
    }
}
