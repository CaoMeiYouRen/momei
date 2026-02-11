import { OpenAIProvider } from './openai-provider'
import { AnthropicProvider } from './anthropic-provider'
import { MockAIProvider } from './mock-provider'
import type { AIConfig, AIImageConfig, AIProvider } from '@/types/ai'
import {
    AI_MAX_TOKENS,
    AI_TEMPERATURE,
} from '@/utils/shared/env'
import { getSettings } from '~/server/services/setting'
import { SettingKey } from '~/types/setting'

export async function getAIProvider(configOverride?: Partial<AIConfig>): Promise<AIProvider> {
    const dbSettings = await getSettings([
        SettingKey.AI_ENABLED,
        SettingKey.AI_PROVIDER,
        SettingKey.AI_API_KEY,
        SettingKey.AI_MODEL,
        SettingKey.AI_ENDPOINT,
    ])

    const config: AIConfig = {
        enabled: dbSettings[SettingKey.AI_ENABLED] === 'true',
        provider: (dbSettings[SettingKey.AI_PROVIDER] as any) || 'openai',
        apiKey: dbSettings[SettingKey.AI_API_KEY]!,
        model: dbSettings[SettingKey.AI_MODEL] || '',
        endpoint: dbSettings[SettingKey.AI_ENDPOINT] || '',
        maxTokens: AI_MAX_TOKENS,
        temperature: AI_TEMPERATURE,
    }
    const finalConfig = { ...config, ...configOverride }

    // If Demo mode is enabled, always return MockAIProvider
    const runtimeConfig = useRuntimeConfig()
    if (runtimeConfig.public.demoMode === true) {
        return new MockAIProvider()
    }

    if (!finalConfig.enabled) {
        throw createError({
            statusCode: 503,
            message: 'AI service is disabled',
        })
    }

    if (!finalConfig.apiKey) {
        throw createError({
            statusCode: 500,
            message: 'AI API key is not configured',
        })
    }

    switch (finalConfig.provider) {
        case 'openai':
            return new OpenAIProvider(finalConfig)
        case 'anthropic':
            return new AnthropicProvider(finalConfig)
        default:
            throw createError({
                statusCode: 400,
                message: `Unsupported AI provider: ${finalConfig.provider}`,
            })
    }
}

export async function getAIImageProvider(configOverride?: Partial<AIImageConfig>): Promise<AIProvider> {
    const dbSettings = await getSettings([
        SettingKey.AI_IMAGE_ENABLED,
        SettingKey.AI_IMAGE_PROVIDER,
        SettingKey.AI_IMAGE_API_KEY,
        SettingKey.AI_IMAGE_MODEL,
        SettingKey.AI_IMAGE_ENDPOINT,
    ])

    const config: AIImageConfig = {
        enabled: dbSettings[SettingKey.AI_IMAGE_ENABLED] === 'true',
        provider: (dbSettings[SettingKey.AI_IMAGE_PROVIDER] as any) || 'openai',
        apiKey: dbSettings[SettingKey.AI_IMAGE_API_KEY]! || dbSettings[SettingKey.AI_API_KEY]!,
        model: dbSettings[SettingKey.AI_IMAGE_MODEL] || '',
        endpoint: dbSettings[SettingKey.AI_IMAGE_ENDPOINT] || dbSettings[SettingKey.AI_ENDPOINT] || '',
    }
    const finalConfig = { ...config, ...configOverride }

    // If Demo mode is enabled, always return MockAIProvider
    const runtimeConfig = useRuntimeConfig()
    if (runtimeConfig.public.demoMode === true) {
        return new MockAIProvider()
    }

    if (!finalConfig.enabled) {
        throw createError({
            statusCode: 503,
            message: 'AI Image service is disabled',
        })
    }

    if (!finalConfig.apiKey) {
        throw createError({
            statusCode: 500,
            message: 'AI Image API key is not configured',
        })
    }

    switch (finalConfig.provider) {
        case 'openai':
        case 'gemini':
        case 'stable-diffusion':
        case 'doubao':
            return new OpenAIProvider({
                ...finalConfig,
                maxTokens: AI_MAX_TOKENS,
                temperature: AI_TEMPERATURE,
            })
        default:
            throw createError({
                statusCode: 400,
                message: `Unsupported AI Image provider: ${finalConfig.provider}`,
            })
    }
}

export * from './openai-provider'
export * from './anthropic-provider'
