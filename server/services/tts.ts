import type { TTSProvider } from '../types/tts'
import { OpenAITTSProvider } from './tts/openai'
import { SiliconFlowTTSProvider } from './tts/siliconflow'
import { getSettings } from './setting'
import { SettingKey } from '@/types/setting'

export class TTSService {
    private static providers = new Map<string, TTSProvider>()

    /**
     * 获取 TTS 提供者实例 (异步)
     * @param name 提供者名称 (openai, siliconflow)
     * @param configOverride 可选的配置覆盖
     */
    static async getProvider(name?: string, configOverride?: any): Promise<TTSProvider> {
        const dbSettings = await getSettings([
            SettingKey.TTS_PROVIDER,
            SettingKey.TTS_API_KEY,
            SettingKey.TTS_ENDPOINT,
            SettingKey.TTS_MODEL,
        ])

        const providerName = (name || dbSettings[SettingKey.TTS_PROVIDER] || 'openai').toLowerCase()
        const apiKey = dbSettings[SettingKey.TTS_API_KEY]
        const endpoint = dbSettings[SettingKey.TTS_ENDPOINT]
        const defaultModel = dbSettings[SettingKey.TTS_MODEL]

        // 某些情况下我们可能不想缓存 (比如有 configOverride)
        if (!configOverride && this.providers.has(providerName)) {
            // TODO: 这里如果数据库配置变了，缓存可能需要刷新
            // 简单处理：先不缓存或在缓存中检查配置是否一致
        }

        let provider: TTSProvider
        switch (providerName) {
            case 'openai':
                if (!apiKey) {
                    throw new Error('OpenAI API Key is not configured')
                }
                provider = new OpenAITTSProvider({
                    apiKey,
                    endpoint: endpoint || undefined,
                    defaultModel: defaultModel || undefined,
                    ...configOverride,
                })
                break
            case 'siliconflow': {
                if (!apiKey) {
                    throw new Error('SiliconFlow API Key is not configured')
                }
                provider = new SiliconFlowTTSProvider({
                    apiKey,
                    endpoint: endpoint || 'https://api.siliconflow.cn/v1',
                    defaultModel: defaultModel || 'FunAudioLLM/CosyVoice2-0.5B',
                    ...configOverride,
                })
                break
            }
            default:
                throw new Error(`Unsupported TTS provider: ${providerName}`)
        }

        if (!configOverride) {
            this.providers.set(providerName, provider)
        }
        return provider
    }

    /**
     * 获取所有可用的提供者名称
     */
    static async getAvailableProviders(): Promise<string[]> {
        const dbSettings = await getSettings([
            SettingKey.TTS_PROVIDER,
            SettingKey.TTS_API_KEY,
        ])

        const available: string[] = []
        // 如果环境变量或数据库明确配置了其中之一，则认为它是可用的
        // 这里的逻辑可以根据实际需求调整：是显示所有支持的，还是仅显示配置了 Key 的
        if (dbSettings[SettingKey.TTS_API_KEY]) {
            available.push('openai')
            available.push('siliconflow')
        }

        // 如果当前设置了一个提供商，且它不在列表中（虽然理论上不会），确保它在
        const current = dbSettings[SettingKey.TTS_PROVIDER] as string
        if (current && !available.includes(current.toLowerCase())) {
            available.push(current.toLowerCase())
        }

        return available
    }
}
