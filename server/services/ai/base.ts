import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import logger from '@/server/utils/logger'
import type { AICategory } from '@/types/ai'

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
        payload: any
        response?: any
        error?: any
        postId?: string
        audioDuration?: number
        audioSize?: number
        textLength?: number
        language?: string
        cost?: number
    }) {
        const { id, userId, type, provider, model, status, payload, response, error, postId, audioDuration, audioSize, textLength, language, cost } = options
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
                    type,
                    payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
                })
            }

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

            Object.assign(task, {
                type,
                provider: provider || task.provider,
                model: model || task.model,
                status: status || (error ? 'failed' : 'completed'),
                payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
                result: result || task.result,
                error: errorMsg,
                postId: postId || task.postId,
                audioDuration: audioDuration || task.audioDuration,
                audioSize: audioSize || task.audioSize,
                textLength: textLength || task.textLength,
                language: language || task.language,
                actualCost: cost || task.actualCost,
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
