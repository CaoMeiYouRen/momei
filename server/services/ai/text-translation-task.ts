import { AIBaseService } from './base'
import { translateInChunks } from './text-translation'
import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import { calculateQuotaUnits, deriveChargeStatus, inferFailureStage } from '@/server/utils/ai/cost-governance'
import logger from '@/server/utils/logger'
import { sendInAppNotification } from '@/server/services/notification'
import {
    AI_MAX_CONTENT_LENGTH,
    AI_TEXT_TASK_CHUNK_SIZE,
    AI_TEXT_TASK_CONCURRENCY,
} from '@/utils/shared/env'
import { NotificationType } from '@/utils/shared/notification'

export class TextTranslationTaskService extends AIBaseService {
    static async createTranslateTask(content: string, to: string, userId: string) {
        if (content.length > AI_MAX_CONTENT_LENGTH) {
            throw createError({
                statusCode: 413,
                message: 'Content too long',
            })
        }

        const payload = {
            content,
            to,
            chunkSize: AI_TEXT_TASK_CHUNK_SIZE,
            concurrency: AI_TEXT_TASK_CONCURRENCY,
        }
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

        this.processTranslateTask(task.id, content, to, userId).catch((error) => {
            logger.error(`[TextTranslationTaskService] Failed to process translation task ${task.id}:`, error)
        })

        return task
    }

    private static async processTranslateTask(
        taskId: string,
        content: string,
        to: string,
        userId: string,
    ) {
        const taskRepo = dataSource.getRepository(AITask)
        const task = await taskRepo.findOneBy({ id: taskId, userId })
        if (!task) {
            return
        }

        const payload = {
            content,
            to,
            chunkSize: AI_TEXT_TASK_CHUNK_SIZE,
            concurrency: AI_TEXT_TASK_CONCURRENCY,
        }

        try {
            task.status = 'processing'
            task.startedAt = task.startedAt || new Date()
            task.progress = 1
            await taskRepo.save(task)

            const result = await translateInChunks(content, to, {
                chunkSize: AI_TEXT_TASK_CHUNK_SIZE,
                concurrency: AI_TEXT_TASK_CONCURRENCY,
                onChunkComplete: async ({ completedChunks, totalChunks }) => {
                    task.progress = Math.min(
                        95,
                        Math.max(task.progress || 0, Math.round((completedChunks / totalChunks) * 95)),
                    )
                    await taskRepo.save(task).catch((progressError) => {
                        logger.warn(`[TextTranslationTaskService] Failed to update translation task progress ${taskId}:`, progressError)
                    })
                },
            })

            const quotaUnits = calculateQuotaUnits({
                category: 'text',
                type: 'translate',
                usageSnapshot: result.usageSnapshot,
            })

            await this.recordTask({
                id: taskId,
                userId,
                category: 'text',
                type: 'translate',
                status: 'completed',
                provider: result.provider,
                model: result.model,
                payload,
                response: {
                    content: result.content,
                    chunkCount: result.chunkCount,
                    targetLanguage: to,
                    usage: result.usage,
                },
                progress: 100,
                textLength: content.length,
                quotaUnits,
                usageSnapshot: result.usageSnapshot,
                settlementSource: 'actual',
            })

            await sendInAppNotification({
                userId,
                type: NotificationType.SYSTEM,
                title: 'AI 翻译完成',
                content: `您的翻译任务已完成，目标语言为 ${to}。`,
                link: `/posts?taskId=${taskId}`,
            }).catch((notificationError) => {
                logger.error('[TextTranslationTaskService] Failed to send completion notification:', notificationError)
            })
        } catch (error) {
            await this.recordTask({
                id: taskId,
                userId,
                category: 'text',
                type: 'translate',
                payload,
                error,
                progress: task.progress || 0,
                textLength: content.length,
                failureStage: inferFailureStage(error),
                settlementSource: 'estimated',
            })

            await sendInAppNotification({
                userId,
                type: NotificationType.SYSTEM,
                title: 'AI 翻译失败',
                content: `您的翻译任务失败，请稍后重试。`,
                link: `/posts?taskId=${taskId}`,
            }).catch((notificationError) => {
                logger.error('[TextTranslationTaskService] Failed to send failure notification:', notificationError)
            })
        }
    }
}
