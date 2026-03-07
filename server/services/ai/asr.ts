import { AIBaseService } from './base'
import { getAIProvider } from '@/server/utils/ai'
import { inferFailureStage } from '@/server/utils/ai/cost-governance'
import { withAITimeout } from '@/server/utils/ai/timeout'
import { sendInAppNotification, pushRealtimeEvent } from '@/server/services/notification'
import { NotificationType } from '@/utils/shared/notification'
import logger from '@/server/utils/logger'
import type { TranscribeOptions } from '@/types/ai'

export class ASRService extends AIBaseService {
    /**
     * 转录音频为文本
     */
    static async transcribe(audio: Buffer | Blob, options: Partial<TranscribeOptions> = {}, userId?: string) {
        const provider = await getAIProvider('asr')

        try {
            if (!provider.transcribe) {
                throw new Error(`Provider ${provider.name} does not support ASR`)
            }

            const response = await withAITimeout(
                provider.transcribe({
                    audioBuffer: audio instanceof Buffer ? audio : Buffer.from(await (audio as Blob).arrayBuffer()),
                    fileName: (options as any).fileName || 'audio.webm',
                    mimeType: (options as any).mimeType || 'audio/webm',
                    ...options,
                } as TranscribeOptions),
                'ASR transcription',
            )

            const audioSize = audio instanceof Buffer ? audio.length : (audio as any).size
            const textLength = response.text.length

            await this.recordTask({
                userId,
                category: 'asr',
                type: 'transcription',
                provider: provider.name,
                model: options.model || (provider as any).model || (provider as any).config?.model || 'unknown',
                payload: { options, size: audioSize },
                response: { text: response.text },
                audioSize,
                textLength,
                language: options.language,
            })

            return response
        } catch (error: any) {
            logger.error('[ASRService] Transcription failed:', error)
            await this.recordTask({
                userId,
                category: 'asr',
                type: 'transcription',
                provider: provider.name,
                model: options.model || (provider as any).model || (provider as any).config?.model || 'unknown',
                payload: { options },
                error,
                failureStage: inferFailureStage(error),
                settlementSource: 'actual',
            })
            throw error
        }
    }

    /**
     * 创建异步 ASR 任务
     * 用于大文件或长时间转录场景
     */
    static async createAsyncTask(options: {
        userId: string
        audioBuffer: Buffer
        fileName: string
        mimeType: string
        language?: string
        provider?: string
    }): Promise<{ taskId: string }> {
        const { userId, audioBuffer, fileName, mimeType, language, provider: preferredProvider } = options

        // 获取提供者
        const provider = await getAIProvider('asr')
        const providerName = preferredProvider || provider.name

        // 创建任务记录
        const task = await this.recordTask({
            userId,
            type: 'async_transcription',
            category: 'asr',
            status: 'pending',
            provider: providerName,
            model: (provider as any).model || (provider as any).config?.model || 'unknown',
            payload: {
                fileName,
                mimeType,
                language,
                size: audioBuffer.length,
            },
            audioSize: audioBuffer.length,
            settlementSource: 'estimated',
        })

        if (!task?.id) {
            throw createError({
                statusCode: 500,
                message: 'Failed to create ASR task',
            })
        }

        // 异步执行转录 (不阻塞响应)
        void this.executeAsyncTranscription({
            taskId: task.id,
            userId,
            audioBuffer,
            fileName,
            mimeType,
            language,
            provider: providerName,
        }).catch(async (err) => {
            logger.error('[ASRService] Async transcription failed:', err)

            // 更新任务状态为失败
            await this.recordTask({
                id: task.id,
                userId,
                type: 'async_transcription',
                category: 'asr',
                status: 'failed',
                error: err,
                failureStage: inferFailureStage(err),
                settlementSource: 'actual',
            })

            pushRealtimeEvent(userId, {
                type: 'ASR_TASK_UPDATE',
                taskId: task.id,
                status: 'failed',
                progress: 100,
                error: err.message || '任务执行失败',
            })

            // 发送失败通知
            await sendInAppNotification({
                userId,
                type: NotificationType.SYSTEM,
                title: '语音转写失败',
                content: `您的音频文件 ${fileName} 转写失败: ${err.message || '未知错误'}`,
            }).catch((e) => logger.error('[ASRService] Failed to send notification:', e))
        })

        return { taskId: task.id }
    }

    /**
     * 执行异步转录
     */
    private static async executeAsyncTranscription(options: {
        taskId: string
        userId: string
        audioBuffer: Buffer
        fileName: string
        mimeType: string
        language?: string
        provider: string
    }): Promise<void> {
        const { taskId, userId, audioBuffer, fileName, mimeType, language } = options

        // 更新状态为处理中
        await this.recordTask({
            id: taskId,
            userId,
            type: 'async_transcription',
            category: 'asr',
            status: 'processing',
            progress: 10,
            settlementSource: 'estimated',
        })

        pushRealtimeEvent(userId, {
            type: 'ASR_TASK_UPDATE',
            taskId,
            status: 'processing',
            progress: 10,
        })

        try {
            const provider = await getAIProvider('asr')

            if (!provider.transcribe) {
                throw new Error(`Provider does not support ASR`)
            }

            // 执行转录
            const response = await withAITimeout(
                provider.transcribe({
                    audioBuffer,
                    fileName,
                    mimeType,
                    language,
                } as TranscribeOptions),
                'ASR async transcription',
            )

            // 更新状态为完成
            await this.recordTask({
                id: taskId,
                userId,
                type: 'async_transcription',
                category: 'asr',
                status: 'completed',
                progress: 100,
                response: {
                    text: response.text,
                    duration: response.duration,
                    language: response.language,
                },
                textLength: response.text.length,
                audioDuration: response.duration,
                language: response.language,
                settlementSource: 'actual',
            })

            pushRealtimeEvent(userId, {
                type: 'ASR_TASK_UPDATE',
                taskId,
                status: 'completed',
                progress: 100,
                result: {
                    text: response.text,
                    duration: response.duration,
                    language: response.language,
                },
            })

            // 发送完成通知
            await sendInAppNotification({
                userId,
                type: NotificationType.SYSTEM,
                title: '语音转写完成',
                content: `您的音频文件已成功转写，共 ${response.text.length} 个字符。`,
                link: `/posts?taskId=${taskId}`,
            }).catch((e) => logger.error('[ASRService] Failed to send notification:', e))
        } catch (err: any) {
            // 更新状态为失败
            await this.recordTask({
                id: taskId,
                userId,
                type: 'async_transcription',
                category: 'asr',
                status: 'failed',
                error: err,
                failureStage: inferFailureStage(err),
                settlementSource: 'actual',
            })

            pushRealtimeEvent(userId, {
                type: 'ASR_TASK_UPDATE',
                taskId,
                status: 'failed',
                progress: 100,
                error: err.message || '任务执行失败',
            })

            throw err
        }
    }

    /**
     * 获取 ASR 任务状态
     */
    static async getASRTaskStatus(taskId: string, userId: string) {
        return super.getTaskStatus(taskId, userId)
    }
}
