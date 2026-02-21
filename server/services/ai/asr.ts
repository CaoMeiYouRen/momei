import { AIBaseService } from './base'
import { getAIProvider } from '@/server/utils/ai'
import { dataSource } from '@/server/database'
import { ASRQuota } from '@/server/entities/asr-quota'
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

            const response = await provider.transcribe({
                audioBuffer: audio instanceof Buffer ? audio : Buffer.from(await (audio as Blob).arrayBuffer()),
                fileName: (options as any).fileName || 'audio.webm',
                mimeType: (options as any).mimeType || 'audio/webm',
                ...options,
            } as TranscribeOptions)

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

            // 更新 ASR 特定配额
            if (userId) {
                await this.updateQuota({
                    userId,
                    provider: provider.name,
                    duration: 0, // 如果能获取时长更好
                }).catch((e) => logger.error('[ASRService] Failed to update quota:', e))
            }

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
            })
            throw error
        }
    }

    static async checkQuota(userId: string, provider: string, durationSeconds: number) {
        const repo = dataSource.getRepository(ASRQuota)

        // Check daily/monthly/total quota
        const quota = await repo.findOneBy({ userId, provider, periodType: 'total' })

        if (!quota) {
            // Create a default quota if not exists
            const newQuota = repo.create({
                userId,
                provider,
                periodType: 'total',
                usedSeconds: 0,
                maxSeconds: 3600, // 1 hour free
            })
            await repo.save(newQuota)
            return true
        }

        if (quota.usedSeconds + durationSeconds > quota.maxSeconds) {
            throw createError({
                statusCode: 403,
                message: 'ASR quota exceeded',
            })
        }

        return true
    }

    static async updateQuota(options: {
        userId: string
        provider: string
        duration: number
    }) {
        const { userId, provider, duration } = options

        const quotaRepo = dataSource.getRepository(ASRQuota)

        // Update quota
        const quota = await quotaRepo.findOneBy({ userId, provider, periodType: 'total' })
        if (quota) {
            quota.usedSeconds += duration
            await quotaRepo.save(quota)
        }
    }
}
