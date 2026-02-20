import { createError } from 'h3'
import type { TTSAudioVoice, TTSOptions, AIProvider } from '@/types/ai'

export class SiliconFlowTTSProvider implements Partial<AIProvider> {
    name = 'siliconflow'

    // 系统预置音色
    private systemVoices: TTSAudioVoice[] = [
        { id: 'alex', name: 'Alex (沉稳男声)', language: 'zh-CN', gender: 'male' },
        { id: 'benjamin', name: 'Benjamin (低沉男声)', language: 'zh-CN', gender: 'male' },
        { id: 'charles', name: 'Charles (磁性男声)', language: 'zh-CN', gender: 'male' },
        { id: 'david', name: 'David (欢快男声)', language: 'zh-CN', gender: 'male' },
        { id: 'anna', name: 'Anna (沉稳女声)', language: 'zh-CN', gender: 'female' },
        { id: 'bella', name: 'Bella (激情女声)', language: 'zh-CN', gender: 'female' },
        { id: 'claire', name: 'Claire (温柔女声)', language: 'zh-CN', gender: 'female' },
        { id: 'diana', name: 'Diana (欢快女声)', language: 'zh-CN', gender: 'female' },
    ]

    private apiKey: string
    private endpoint: string
    public model: string

    constructor(config: { apiKey: string, endpoint?: string, defaultModel?: string }) {
        this.apiKey = config.apiKey
        this.endpoint = config.endpoint || 'https://api.siliconflow.cn/v1'
        this.model = config.defaultModel || 'FunAudioLLM/CosyVoice2-0.5B'
    }

    get availableVoices(): TTSAudioVoice[] {
        // 返回带上前缀的 ID，因为 SiliconFlow 请求时需要带上模型名称
        // 除非是 custom uri
        return this.systemVoices.map((v) => ({
            ...v,
            id: `${this.model}:${v.id}`,
        }))
    }

    async getVoices(): Promise<TTSAudioVoice[]> {
        const voices = [...this.availableVoices]

        // 尝试获取动态音色
        try {
            const baseUrl = this.endpoint.endsWith('/') ? this.endpoint.slice(0, -1) : this.endpoint
            const response = await fetch(`${baseUrl}/audio/voice/list`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                // 根据文档，data 应该包含音色列表
                if (Array.isArray(data)) {
                    data.forEach((item: any) => {
                        if (item.uri) {
                            voices.push({
                                id: item.uri,
                                name: item.customName || item.uri.split(':')[1] || 'Custom Voice',
                                language: 'auto',
                                gender: 'neutral',
                            })
                        }
                    })
                }
            }
        } catch (error) {
            console.error('Failed to fetch SiliconFlow custom voices:', error)
        }

        return voices
    }


    estimateCost(text: string, _voice: string): Promise<number> {
        void _voice
        // SiliconFlow TTS 计费: 按照输入文本长度对应的 UTF-8 字节数进行计费
        // 不同模型计费不同，这里取一个大概的中间值
        const bytes = Buffer.from(text).length
        // 假设每 1M 字节 5 元 (RMB) -> 约 $0.7
        return Promise.resolve((bytes / 1000000) * 0.7)
    }

    async generateSpeech(
        text: string,
        voice: string,
        options: TTSOptions,
    ): Promise<ReadableStream<Uint8Array>> {
        const baseUrl = this.endpoint.endsWith('/') ? this.endpoint.slice(0, -1) : this.endpoint

        try {
            const response = await fetch(`${baseUrl}/audio/speech`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    input: text,
                    voice,
                    response_format: options.outputFormat || 'mp3',
                    speed: options.speed || 1.0,
                    stream: false,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw createError({
                    statusCode: response.status,
                    message: `SiliconFlow TTS Error: ${errorData.message || response.statusText}`,
                })
            }

            if (!response.body) {
                throw createError({
                    statusCode: 500,
                    message: 'SiliconFlow TTS Error: No response body',
                })
            }

            return response.body as unknown as ReadableStream<Uint8Array>
        } catch (error: any) {
            throw createError({
                statusCode: error.statusCode || 500,
                message: error.message || 'SiliconFlow TTS request failed',
            })
        }
    }
}
