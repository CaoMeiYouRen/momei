import { dataSource } from '../../database'
import { AITask } from '../../entities/ai-task'
import logger from '../../utils/logger'
import type { AICategory } from '@/types/ai'

export abstract class AIBaseService {
    /**
     * 记录 AI 任务到数据库
     */
    protected static async recordTask(options: {
        userId: string | undefined
        type: string
        category: AICategory
        provider: string
        model: string
        payload: any
        response?: any
        error?: any
        postId?: string
    }) {
        const { userId, type, provider, model, payload, response, error, postId } = options
        if (!userId) {
            return
        }
        try {
            const repo = dataSource.getRepository(AITask)
            let result = undefined
            if (response) {
                result = typeof response === 'string' ? response : JSON.stringify(response)
            }

            const task = repo.create({
                userId,
                type,
                provider,
                model,
                status: error ? 'failed' : 'completed',
                payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
                result,
                error: error ? (error.message || String(error)) : undefined,
                postId,
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
