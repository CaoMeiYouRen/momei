import { OpenAIProvider } from './openai-provider'
import { AnthropicProvider } from './anthropic-provider'
import { MockAIProvider } from './mock-provider'
import { SiliconFlowASRProvider } from './asr-siliconflow'
import { VolcengineASRProvider } from './asr-volcengine'
import { OpenAITTSProvider } from './tts-openai'
import { SiliconFlowTTSProvider } from './tts-siliconflow'
import { VolcengineTTSProvider } from './tts-volcengine'
import type { AIConfig, AIProvider, AICategory } from '@/types/ai'
import {
    AI_MAX_TOKENS,
    AI_TEMPERATURE,
} from '@/utils/shared/env'
import { getSettings } from '~/server/services/setting'
import { SettingKey } from '~/types/setting'

/**
 * 获取指定类别的 AI 提供者
 * 支持从主 AI 配置继承（如果子配置未设置）
 * @param categoryOrConfig 类别 (text, image, tts, asr) 或直接传递配置对象
 * @param configOverride 可选的配置覆盖
 */
export async function getAIProvider(categoryOrConfig: AICategory | Partial<AIConfig> = 'text', configOverride?: Partial<AIConfig>): Promise<AIProvider> {
    const category = typeof categoryOrConfig === 'string' ? categoryOrConfig : 'text'
    const manualConfig = typeof categoryOrConfig === 'object' ? categoryOrConfig : configOverride

    const isMain = category === 'text'
    const prefix = category === 'text' ? 'AI' : category.toUpperCase()

    // 确定需要获取的设置键
    const enabledKey = isMain ? SettingKey.AI_ENABLED : (SettingKey as any)[`${prefix}_ENABLED`]
    const providerKey = isMain ? SettingKey.AI_PROVIDER : (SettingKey as any)[`${prefix}_PROVIDER`]
    const apiKeyKey = isMain ? SettingKey.AI_API_KEY : (SettingKey as any)[`${prefix}_API_KEY`]
    const modelKey = isMain ? SettingKey.AI_MODEL : (SettingKey as any)[`${prefix}_MODEL`]
    const endpointKey = isMain ? SettingKey.AI_ENDPOINT : (SettingKey as any)[`${prefix}_ENDPOINT`]

    const dbSettings = await getSettings([
        SettingKey.AI_ENABLED,
        SettingKey.AI_PROVIDER,
        SettingKey.AI_API_KEY,
        SettingKey.AI_MODEL,
        SettingKey.AI_ENDPOINT,
        SettingKey.ASR_VOLCENGINE_APP_ID,
        SettingKey.ASR_VOLCENGINE_CLUSTER_ID,
        SettingKey.VOLCENGINE_APP_ID,
        SettingKey.VOLCENGINE_ACCESS_KEY,
        enabledKey,
        providerKey,
        apiKeyKey,
        modelKey,
        endpointKey,
    ].filter(Boolean))

    // 继承逻辑：如果子模块未配置，则尝试使用主配置
    const config: AIConfig = {
        enabled: (dbSettings[enabledKey] || dbSettings[SettingKey.AI_ENABLED]) === 'true',
        provider: (dbSettings[providerKey] || dbSettings[SettingKey.AI_PROVIDER] || 'openai') as any,
        apiKey: dbSettings[apiKeyKey] || dbSettings[SettingKey.AI_API_KEY] || '',
        model: dbSettings[modelKey] || dbSettings[SettingKey.AI_MODEL] || '',
        endpoint: dbSettings[endpointKey] || dbSettings[SettingKey.AI_ENDPOINT] || '',
        maxTokens: AI_MAX_TOKENS,
        temperature: AI_TEMPERATURE,
    }

    const finalConfig = { ...config, ...manualConfig }

    // Demo 模式且不是 ASR/TTS (ASR/TTS 耗费通常较低或有免费额度，或者 Mock 不好做)
    const runtimeConfig = useRuntimeConfig()
    if (runtimeConfig.public.demoMode === true && (category === 'text' || category === 'image')) {
        return new MockAIProvider() as any
    }

    if (!finalConfig.enabled) {
        throw createError({
            statusCode: 503,
            message: `AI service (${category}) is disabled`,
        })
    }

    if (!finalConfig.apiKey) {
        throw createError({
            statusCode: 500,
            message: `AI API key for ${category} is not configured`,
        })
    }

    // ASR 提供者
    if (category === 'asr') {
        if (finalConfig.provider === 'siliconflow') {
            return new SiliconFlowASRProvider(finalConfig.apiKey, finalConfig.endpoint, finalConfig.model) as any
        }
        if (finalConfig.provider === 'volcengine') {
            return new VolcengineASRProvider({
                appId: dbSettings[SettingKey.ASR_VOLCENGINE_APP_ID] || '',
                token: finalConfig.apiKey,
                cluster: dbSettings[SettingKey.ASR_VOLCENGINE_CLUSTER_ID] || '',
            }) as any
        }
    }

    // TTS 提供者
    if (category === 'tts') {
        if (finalConfig.provider === 'openai') {
            return new OpenAITTSProvider({
                apiKey: finalConfig.apiKey,
                endpoint: finalConfig.endpoint,
                defaultModel: finalConfig.model,
            }) as any
        }
        if (finalConfig.provider === 'siliconflow') {
            return new SiliconFlowTTSProvider({
                apiKey: finalConfig.apiKey,
                endpoint: finalConfig.endpoint,
                defaultModel: finalConfig.model,
            }) as any
        }
        if (finalConfig.provider === 'volcengine') {
            return new VolcengineTTSProvider({
                appId: dbSettings[SettingKey.VOLCENGINE_APP_ID] || dbSettings[SettingKey.ASR_VOLCENGINE_APP_ID] || process.env.VOLCENGINE_APP_ID || '',
                accessKey: finalConfig.apiKey || dbSettings[SettingKey.VOLCENGINE_ACCESS_KEY] || process.env.VOLCENGINE_ACCESS_KEY || '',
                defaultModel: finalConfig.model,
            }) as any
        }
    }

    // 通用文本/图像提供者 (OpenAI 兼容)
    switch (finalConfig.provider as string) {
        case 'openai':
        case 'doubao':
        case 'siliconflow':
        case 'volcengine':
        case 'deepseek':
            return new OpenAIProvider(finalConfig) as any
        case 'anthropic':
            return new AnthropicProvider(finalConfig) as any
        default:
            return new OpenAIProvider(finalConfig) as any
    }
}

/**
 * 获取图片生成提供者 (快捷方式)
 */
export async function getAIImageProvider(): Promise<AIProvider> {
    return await getAIProvider('image')
}
