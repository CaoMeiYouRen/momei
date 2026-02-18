import { getAIProvider } from '../../utils/ai'
import { dataSource } from '../../database'
import { ASRQuota } from '../../entities/asr-quota'
import { ASRUsageLog } from '../../entities/asr-usage-log'
import logger from '../../utils/logger'
import { AIBaseService } from './base'
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
            
            await this.recordTask({
                userId,
                category: 'asr',
                type: 'transcription',
                provider: provider.name,
                model: options.model || (provider as any).config?.model || 'unknown',
                payload: { options, size: audio instanceof Buffer ? audio.length : (audio as any).size },
                response: { text: response.text },
            })

            // 更新 ASR 特定配额和日志 (如果需要保留 ASR 特定统计)
            if (userId) {
                await this.updateQuotaAndLog({
                    userId,
                    provider: provider.name,
                    mode: 'batch',
                    duration: 0, // 如果能获取时长更好
                    size: audio instanceof Buffer ? audio.length : (audio as any).size,
                    textLength: response.text.length,
                    language: options.language,
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
                model: options.model || 'unknown',
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

    static async updateQuotaAndLog(options: {
        userId: string
        provider: string
        mode: 'batch' | 'streaming'
        duration: number
        size: number
        textLength: number
        language?: string
    }) {
        const { userId, provider, mode, duration, size, textLength, language } = options

        const quotaRepo = dataSource.getRepository(ASRQuota)
        const logRepo = dataSource.getRepository(ASRUsageLog)

        // Update quota
        const quota = await quotaRepo.findOneBy({ userId, provider, periodType: 'total' })
        if (quota) {
            quota.usedSeconds += duration
            await quotaRepo.save(quota)
        }

        // Create log
        const log = logRepo.create({
            userId,
            provider,
            mode,
            audioDuration: duration,
            audioSize: size,
            textLength,
            language: language || null,
            cost: 0,
        })
        await logRepo.save(log)
    }
}
