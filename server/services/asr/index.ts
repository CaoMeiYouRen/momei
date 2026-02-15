import { SiliconFlowASRProvider } from './siliconflow'
import { getSettings } from '~/server/services/setting'
import { SettingKey } from '~/types/setting'
import { dataSource } from '~/server/database'
import { ASRQuota } from '~/server/entities/asr-quota'
import { ASRUsageLog } from '~/server/entities/asr-usage-log'
import type { ASRProvider } from '~/types/asr'

export async function getASRProvider(providerName: 'siliconflow' | 'volcengine' = 'siliconflow'): Promise<ASRProvider> {
    const settings = await getSettings([
        SettingKey.ASR_SILICONFLOW_API_KEY,
        SettingKey.ASR_SILICONFLOW_MODEL,
    ])

    if (providerName === 'siliconflow') {
        const apiKey = settings[SettingKey.ASR_SILICONFLOW_API_KEY]
        const model = settings[SettingKey.ASR_SILICONFLOW_MODEL] || 'FunAudioLLM/SenseVoiceSmall'
        if (!apiKey) {
            throw createError({
                statusCode: 400,
                message: 'SiliconFlow API key is not configured',
            })
        }
        return new SiliconFlowASRProvider(apiKey, undefined, model)
    }

    throw createError({
        statusCode: 400,
        message: `Unsupported ASR provider: ${providerName}`,
    })
}

export class ASRService {
    static async checkQuota(userId: string, provider: string, durationSeconds: number) {
        const repo = dataSource.getRepository(ASRQuota)

        // Check daily/monthly/total quota
        // For simplicity, we implement a basic total quota check first
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
            cost: 0, // Should be calculated based on provider pricing
        })
        await logRepo.save(log)
    }
}
