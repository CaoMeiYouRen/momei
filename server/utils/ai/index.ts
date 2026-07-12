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
import { FallbackAIProvider } from './fallback-provider'
import type { AIConfig, AIProvider, AICategory, AIProviderType } from '@/types/ai'
import {
    AI_MAX_TOKENS,
    AI_TEMPERATURE,
} from '@/utils/shared/env'
import logger from '@/server/utils/logger'
import { getSettings } from '~/server/services/setting'
import { SettingKey } from '~/types/setting'

const aiProviderTypes = [
    'openai',
    'anthropic',
    'gemini',
    'stable-diffusion',
    'doubao',
    'siliconflow',
    'volcengine',
    'deepseek',
] as const satisfies readonly AIProviderType[]

function isAIProviderType(value: string): value is AIProviderType {
    return aiProviderTypes.some((provider) => provider === value)
}

function resolveAIProviderType(value: string | null | undefined): AIProviderType {
    return value && isAIProviderType(value) ? value : 'openai'
}

interface CategorySettingKeys {
    enabled: SettingKey
    provider: SettingKey
    apiKey: SettingKey
    model: SettingKey
    endpoint: SettingKey
    fallbackProvider?: SettingKey
    fallbackApiKey?: SettingKey
    fallbackModel?: SettingKey
    fallbackEndpoint?: SettingKey
}

const categorySettingKeys: Partial<Record<AICategory, CategorySettingKeys>> = {
    text: {
        enabled: SettingKey.AI_ENABLED,
        provider: SettingKey.AI_PROVIDER,
        apiKey: SettingKey.AI_API_KEY,
        model: SettingKey.AI_MODEL,
        endpoint: SettingKey.AI_ENDPOINT,
        fallbackProvider: SettingKey.AI_FALLBACK_PROVIDER,
        fallbackApiKey: SettingKey.AI_FALLBACK_API_KEY,
        fallbackModel: SettingKey.AI_FALLBACK_MODEL,
        fallbackEndpoint: SettingKey.AI_FALLBACK_ENDPOINT,
    },
    image: {
        enabled: SettingKey.AI_IMAGE_ENABLED,
        provider: SettingKey.AI_IMAGE_PROVIDER,
        apiKey: SettingKey.AI_IMAGE_API_KEY,
        model: SettingKey.AI_IMAGE_MODEL,
        endpoint: SettingKey.AI_IMAGE_ENDPOINT,
        fallbackProvider: SettingKey.AI_IMAGE_FALLBACK_PROVIDER,
        fallbackApiKey: SettingKey.AI_IMAGE_FALLBACK_API_KEY,
        fallbackModel: SettingKey.AI_IMAGE_FALLBACK_MODEL,
        fallbackEndpoint: SettingKey.AI_IMAGE_FALLBACK_ENDPOINT,
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

/**
 * 获取指定类别的 AI 提供者
 * 支持从主 AI 配置继承（如果子配置未设置）
 * @param categoryOrConfig 类别 (text, image, tts, asr) 或直接传递配置对象
 * @param configOverride 可选的配置覆盖
 */
export async function getAIProvider(categoryOrConfig: AICategory | Partial<AIConfig> = 'text', configOverride?: Partial<AIConfig>): Promise<AIProvider> {
    const category = typeof categoryOrConfig === 'string' ? categoryOrConfig : 'text'
    const manualConfig = typeof categoryOrConfig === 'object' ? categoryOrConfig : configOverride

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
        provider: resolveAIProviderType(dbSettings[providerKey] || dbSettings[SettingKey.AI_PROVIDER]),
        apiKey: dbSettings[apiKeyKey] || dbSettings[SettingKey.AI_API_KEY] || '',
        model: dbSettings[modelKey] || dbSettings[SettingKey.AI_MODEL] || '',
        endpoint: dbSettings[endpointKey] || dbSettings[SettingKey.AI_ENDPOINT] || '',
        maxTokens: AI_MAX_TOKENS,
        temperature: AI_TEMPERATURE,
    }

    const finalConfig = { ...config, ...manualConfig }

    // Demo 模式且不是 ASR/TTS (ASR/TTS 耗费通常较低或有免费额度，或者 Mock 不好做)
    const runtimeConfig = useRuntimeConfig()
    if (runtimeConfig.public.demoMode && (category === 'text' || category === 'image')) {
        return new MockAIProvider()
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
            return new SiliconFlowASRProvider(finalConfig.apiKey, finalConfig.endpoint, finalConfig.model)
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
            })
        }
    }

    // TTS 提供者
    if (category === 'tts') {
        if (finalConfig.provider === 'openai') {
            return new OpenAITTSProvider({
                apiKey: finalConfig.apiKey,
                endpoint: finalConfig.endpoint,
                defaultModel: finalConfig.model,
            })
        }
        if (finalConfig.provider === 'siliconflow') {
            return new SiliconFlowTTSProvider({
                apiKey: finalConfig.apiKey,
                endpoint: finalConfig.endpoint,
                defaultModel: finalConfig.model,
            })
        }
        if (finalConfig.provider === 'volcengine') {
            return new VolcengineTTSProvider({
                appId: dbSettings[SettingKey.VOLCENGINE_APP_ID] || process.env.VOLCENGINE_APP_ID || '',
                accessKey: dbSettings[SettingKey.VOLCENGINE_ACCESS_KEY] || process.env.VOLCENGINE_ACCESS_KEY || '',
                secretKey: dbSettings[SettingKey.VOLCENGINE_SECRET_KEY] || process.env.VOLCENGINE_SECRET_KEY || '',
                defaultModel: finalConfig.model,
            })
        }
    }
    // 通用图像提供者 (OpenAI 兼容)
    if (category === 'image') {
        return createImageProvider(finalConfig, dbSettings)
    }

    // 通用文本提供者 (OpenAI 兼容)
    return createTextProvider(finalConfig, dbSettings)
}

/**
 * 获取图片生成提供者 (快捷方式)
 */
export async function getAIImageProvider(): Promise<AIProvider> {
    return getAIProvider('image')
}

/**
 * 获取带有自动降级能力的 AI Provider。
 *
 * 当主提供商失败时，自动切换至备用提供商重试。
 * 降级事件会记录到日志和可选的监控指标中。
 *
 * @param category 类别 (text/image)
 * @param extraSettings 额外设置键（可选，用于在 getAIProvider 已有获取基础上补充）
 * @returns 包装后的 FallbackAIProvider 或普通 Provider（无备用时）
 */
export async function getAIProviderWithFallback(
    category: 'text' | 'image',
): Promise<AIProvider> {
    const primaryProvider = await getAIProvider(category)

    const resolvedCategoryKeys = categorySettingKeys[category]
    const fbProviderKey = resolvedCategoryKeys?.fallbackProvider
    const fbApiKeyKey = resolvedCategoryKeys?.fallbackApiKey
    const fbModelKey = resolvedCategoryKeys?.fallbackModel
    const fbEndpointKey = resolvedCategoryKeys?.fallbackEndpoint

    // 如果类别没有 fallback 配置定义（如 asr/tts），不包装
    if (!fbProviderKey) {
        return primaryProvider
    }

    const dbSettings = await getSettings([
        fbProviderKey,
        fbApiKeyKey!,
        fbModelKey!,
        fbEndpointKey!,
        SettingKey.AI_ENABLED,
        SettingKey.AI_FALLBACK_PROVIDER,
        SettingKey.AI_FALLBACK_API_KEY,
        SettingKey.AI_FALLBACK_MODEL,
        SettingKey.AI_FALLBACK_ENDPOINT,
        SettingKey.GEMINI_API_TOKEN,
        SettingKey.VOLCENGINE_APP_ID,
        SettingKey.VOLCENGINE_ACCESS_KEY,
        SettingKey.VOLCENGINE_SECRET_KEY,
    ].filter(Boolean))

    // 获取 fallback 提供商名称，优先使用独立配置，否则使用主 fallback 配置
    const fallbackProviderSetting = dbSettings[fbProviderKey] || dbSettings[SettingKey.AI_FALLBACK_PROVIDER]

    // 如果未配置 fallback 提供商，不包装
    if (!fallbackProviderSetting) {
        return primaryProvider
    }

    const fallbackProviderName = resolveAIProviderType(fallbackProviderSetting)

    // 如果 fallback 提供商与主提供商相同，不包装
    if (fallbackProviderName === primaryProvider.name) {
        return primaryProvider
    }

    // 构建 fallback 配置（优先独立配置，否则继承主 AI fallback 配置）
    const fallbackConfig: AIConfig = {
        enabled: true,
        provider: fallbackProviderName,
        apiKey: dbSettings[fbApiKeyKey!]
            || dbSettings[SettingKey.AI_FALLBACK_API_KEY]
            || '',
        model: dbSettings[fbModelKey!]
            || dbSettings[SettingKey.AI_FALLBACK_MODEL]
            || '',
        endpoint: dbSettings[fbEndpointKey!]
            || dbSettings[SettingKey.AI_FALLBACK_ENDPOINT]
            || '',
        maxTokens: AI_MAX_TOKENS,
        temperature: AI_TEMPERATURE,
    }

    // 创建 fallback 提供商实例（复用与 getAIProvider 相同的逻辑）
    let fallbackProvider: AIProvider

    if (category === 'image') {
        fallbackProvider = createImageProvider(fallbackConfig, dbSettings)
    } else {
        fallbackProvider = createTextProvider(fallbackConfig, dbSettings)
    }

    logger.info(`[FallbackAI] Fallback configured: ${primaryProvider.name} → ${fallbackProviderName} for ${category}`, {
        category,
        primaryProvider: primaryProvider.name,
        fallbackProvider: fallbackProviderName,
    })

    return new FallbackAIProvider(primaryProvider, fallbackProvider, category)
}

/**
 * 获取带有自动降级能力的图片生成提供者（快捷方式）
 */
export async function getAIImageProviderWithFallback(): Promise<AIProvider> {
    return getAIProviderWithFallback('image')
}

// ===== Provider creation helpers (used by both getAIProvider and getAIProviderWithFallback) =====

function createTextProvider(config: AIConfig, dbSettings: Record<string, string | null>): AIProvider {
    switch (config.provider) {
        case 'openai':
        case 'doubao':
        case 'siliconflow':
        case 'volcengine':
        case 'deepseek':
            return new OpenAIProvider(config)
        case 'anthropic':
            return new AnthropicProvider(config)
        case 'gemini':
            return new GeminiProvider({
                ...config,
                apiToken: dbSettings[SettingKey.GEMINI_API_TOKEN] || process.env.GEMINI_API_TOKEN,
            })
        default:
            return new OpenAIProvider(config)
    }
}

function createImageProvider(config: AIConfig, dbSettings: Record<string, string | null>): AIProvider {
    switch (config.provider) {
        case 'openai':
        case 'doubao':
        case 'siliconflow':
        case 'volcengine':
            return new OpenAIProvider(config)
        case 'gemini':
            return new GeminiProvider({
                ...config,
                apiToken: dbSettings[SettingKey.GEMINI_API_TOKEN] || process.env.GEMINI_API_TOKEN,
            })
        case 'stable-diffusion':
            return new StableDiffusionProvider(config)
        default:
            return new OpenAIProvider(config)
    }
}
