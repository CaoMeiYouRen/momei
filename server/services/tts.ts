import type { TTSProvider } from '../types/tts'
import { OpenAITTSProvider } from './tts/openai'
import {
    TTS_API_KEY,
    TTS_ENDPOINT,
    TTS_DEFAULT_MODEL,
} from '@/utils/shared/env'

export class TTSService {
    private static providers = new Map<string, TTSProvider>()

    /**
     * 获取 TTS 提供者实例
     * @param name 提供者名称 (openai, siliconflow)
     */
    static getInstance(name: string): TTSProvider {
        const providerName = name.toLowerCase()
        if (this.providers.has(providerName)) {
            return this.providers.get(providerName)!
        }

        let provider: TTSProvider
        switch (providerName) {
            case 'openai':
                if (!TTS_API_KEY) {
                    throw new Error('OpenAI API Key is not configured')
                }
                provider = new OpenAITTSProvider({
                    apiKey: TTS_API_KEY,
                    endpoint: TTS_ENDPOINT,
                    defaultModel: TTS_DEFAULT_MODEL,
                })
                break
            case 'siliconflow': {
                // SiliconFlow 兼容 OpenAI API
                const apiKey = process.env.SILICONFLOW_API_KEY || TTS_API_KEY
                if (!apiKey) {
                    throw new Error('SiliconFlow API Key is not configured')
                }
                provider = new OpenAITTSProvider({
                    apiKey,
                    endpoint: process.env.SILICONFLOW_ENDPOINT || 'https://api.siliconflow.cn/v1',
                    defaultModel: process.env.SILICONFLOW_TTS_MODEL || 'fishaudio/fish-speech-1.4', // 示例模型
                })
                break
            }
            default:
                throw new Error(`Unsupported TTS provider: ${name}`)
        }

        this.providers.set(providerName, provider)
        return provider
    }

    /**
     * 获取所有可用的提供者名称
     */
    static getAvailableProviders(): string[] {
        const available: string[] = []
        if (TTS_API_KEY) {
            available.push('openai')
        }
        if (process.env.SILICONFLOW_API_KEY || TTS_API_KEY) {
            available.push('siliconflow')
        }
        // TODO: 添加其他提供商检测
        return available
    }
}
