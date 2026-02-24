import { OpenAIProvider } from './openai-provider'
import { AnthropicProvider } from './anthropic-provider'
import { GeminiProvider } from './gemini-provider'
import { StableDiffusionProvider } from './stable-diffusion-provider'
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

    const categorySettingKeys: Partial<Record<AICategory, {
        enabled: SettingKey
        provider: SettingKey
        apiKey: SettingKey
        model: SettingKey
        endpoint: SettingKey
    }>> = {
        text: {
            enabled: SettingKey.AI_ENABLED,
            provider: SettingKey.AI_PROVIDER,
            apiKey: SettingKey.AI_API_KEY,
            model: SettingKey.AI_MODEL,
            endpoint: SettingKey.AI_ENDPOINT,
        },
        image: {
            enabled: SettingKey.AI_IMAGE_ENABLED,
            provider: SettingKey.AI_IMAGE_PROVIDER,
            apiKey: SettingKey.AI_IMAGE_API_KEY,
            model: SettingKey.AI_IMAGE_MODEL,
            endpoint: SettingKey.AI_IMAGE_ENDPOINT,
        },
        asr: {
            enabled: SettingKey.ASR_ENABLED,
            provider: SettingKey.ASR_PROVIDER,
            apiKey: SettingKey.ASR_API_KEY,
            model: SettingKey.ASR_MODEL,
            endpoint: SettingKey.ASR_ENDPOINT,
        },
        tts: {
            enabled: SettingKey.TTS_ENABLED,
            provider: SettingKey.TTS_PROVIDER,
            apiKey: SettingKey.TTS_API_KEY,
            model: SettingKey.TTS_MODEL,
            endpoint: SettingKey.TTS_ENDPOINT,
        },
    }

    // 确定需要获取的设置键
    const resolvedCategoryKeys = categorySettingKeys[category] ?? categorySettingKeys.text!
    const enabledKey = resolvedCategoryKeys.enabled
    const providerKey = resolvedCategoryKeys.provider
    const apiKeyKey = resolvedCategoryKeys.apiKey
    const modelKey = resolvedCategoryKeys.model
    const endpointKey = resolvedCategoryKeys.endpoint

    const dbSettings = await getSettings([
        SettingKey.AI_ENABLED,
        SettingKey.AI_PROVIDER,
        SettingKey.AI_API_KEY,
        SettingKey.AI_MODEL,
        SettingKey.AI_ENDPOINT,
        SettingKey.GEMINI_API_TOKEN,
        SettingKey.ASR_VOLCENGINE_CLUSTER_ID,
        SettingKey.VOLCENGINE_APP_ID,
        SettingKey.VOLCENGINE_ACCESS_KEY,
        SettingKey.VOLCENGINE_SECRET_KEY,
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

    const providerName = String(finalConfig.provider)
    const needsApiKey = !(
        (category === 'asr' && providerName === 'volcengine')
        || (category === 'tts' && providerName === 'volcengine')
    )

    if (needsApiKey && !finalConfig.apiKey) {
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
            const configuredModelOrResourceId = dbSettings[SettingKey.ASR_MODEL] || ''
            const configuredVolcResourceId = dbSettings[SettingKey.ASR_VOLCENGINE_CLUSTER_ID] || ''
            let resolvedVolcResourceId = ''
            if (configuredModelOrResourceId.startsWith('volc.')) {
                resolvedVolcResourceId = configuredModelOrResourceId
            } else if (configuredVolcResourceId.startsWith('volc.')) {
                resolvedVolcResourceId = configuredVolcResourceId
            }

            return new VolcengineASRProvider({
                appId: dbSettings[SettingKey.VOLCENGINE_APP_ID] || process.env.VOLCENGINE_APP_ID || '',
                token: dbSettings[SettingKey.VOLCENGINE_ACCESS_KEY] || process.env.VOLCENGINE_ACCESS_KEY || '',
                cluster: dbSettings[SettingKey.ASR_VOLCENGINE_CLUSTER_ID] || '',
                endpoint: dbSettings[SettingKey.ASR_ENDPOINT] || process.env.ASR_ENDPOINT || '',
                resourceId: resolvedVolcResourceId,
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
                appId: dbSettings[SettingKey.VOLCENGINE_APP_ID] || process.env.VOLCENGINE_APP_ID || '',
                accessKey: dbSettings[SettingKey.VOLCENGINE_ACCESS_KEY] || process.env.VOLCENGINE_ACCESS_KEY || '',
                secretKey: dbSettings[SettingKey.VOLCENGINE_SECRET_KEY] || process.env.VOLCENGINE_SECRET_KEY || '',
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
            return new OpenAIProvider(finalConfig)
        case 'anthropic':
            return new AnthropicProvider(finalConfig)
        case 'gemini':
            return new GeminiProvider({
                ...finalConfig,
                // Gemini 可能需要额外的 apiToken 用于鉴权，优先从环境变量获取
                apiToken: dbSettings[SettingKey.GEMINI_API_TOKEN] || process.env.GEMINI_API_TOKEN,
            })
        case 'stable-diffusion':
            return new StableDiffusionProvider(finalConfig)
        default:
            return new OpenAIProvider(finalConfig)
    }
}

/**
 * 获取图片生成提供者 (快捷方式)
 */
export async function getAIImageProvider(): Promise<AIProvider> {
    return await getAIProvider('image')
}
