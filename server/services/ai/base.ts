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
import logger from '@/server/utils/logger'
import type { AICategory, AIChargeStatus, AIFailureStage, AIUsageSnapshot } from '@/types/ai'

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
    /**
     * 获取任务状态
     */
    static async getTaskStatus(taskId: string, userId: string) {
        const repo = dataSource.getRepository(AITask)
        const task = await repo.findOneBy({ id: taskId, userId })

        if (!task) {
            throw createError({
                statusCode: 404,
                message: 'Task not found',
            })
        }

        const result = task.result ? JSON.parse(task.result) : null

        return {
            id: task.id,
            status: task.status,
            progress: task.progress || 0,
            result,
            // 额外提取一些常用字段到外层方便前端使用
            audioUrl: result?.audioUrl || result?.url || null,
            error: task.error,
            updatedAt: task.updatedAt,
        }
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
