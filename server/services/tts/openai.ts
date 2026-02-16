import { createError } from 'h3'
import type { TTSAudioVoice, TTSOptions, TTSProvider } from '../../types/tts'

export class OpenAITTSProvider implements TTSProvider {
    name = 'openai'
    availableVoices: TTSAudioVoice[] = [
        { id: 'alloy', name: 'Alloy', language: 'en', gender: 'neutral' },
        { id: 'echo', name: 'Echo', language: 'en', gender: 'male' },
        { id: 'fable', name: 'Fable', language: 'en', gender: 'neutral' },
        { id: 'onyx', name: 'Onyx', language: 'en', gender: 'male' },
        { id: 'nova', name: 'Nova', language: 'en', gender: 'female' },
        { id: 'shimmer', name: 'Shimmer', language: 'en', gender: 'female' },
    ]

    private apiKey: string
    private endpoint: string
    private defaultModel: string

    constructor(config: { apiKey: string, endpoint?: string, defaultModel?: string }) {
        this.apiKey = config.apiKey
        this.endpoint = config.endpoint || 'https://api.openai.com/v1'
        this.defaultModel = config.defaultModel || 'tts-1'
    }

    getVoices(): Promise<TTSAudioVoice[]> {
        return Promise.resolve(this.availableVoices)
    }


    estimateCost(text: string, _voice: string): Promise<number> {
        // OpenAI TTS 定价: $15/1M 字符 (tts-1), $30/1M 字符 (tts-1-hd)
        const chars = text.length
        const rate = this.defaultModel.includes('hd') ? 30 : 15
        return Promise.resolve((chars / 1000000) * rate)
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
                    model: this.defaultModel,
                    input: text,
                    voice,
                    response_format: options.outputFormat || 'mp3',
                    speed: options.speed || 1.0,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw createError({
                    statusCode: response.status,
                    message: `OpenAI TTS Error: ${errorData.error?.message || response.statusText}`,
                })
            }

            if (!response.body) {
                throw createError({
                    statusCode: 500,
                    message: 'OpenAI TTS Error: No response body',
                })
            }

            return response.body as unknown as ReadableStream<Uint8Array>
        } catch (error: any) {
            throw createError({
                statusCode: error.statusCode || 500,
                message: error.message || 'OpenAI TTS request failed',
            })
        }
    }
}
