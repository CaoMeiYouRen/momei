import { requestTTSAudioStream } from './tts-http-shared'
import { stripTrailingSlash } from '@/utils/shared/url'
import type { TTSAudioVoice, TTSOptions, AIProvider, TTSVoiceQuery } from '@/types/ai'

function resolveOpenAITTSErrorMessage(errorData: Record<string, unknown>, fallback: string): string {
    const nestedError = errorData.error
    if (typeof nestedError !== 'object' || nestedError === null) {
        return `OpenAI TTS Error: ${fallback}`
    }

    const errorMessage = 'message' in nestedError && typeof nestedError.message === 'string'
        ? nestedError.message
        : fallback
    return `OpenAI TTS Error: ${errorMessage}`
}

export class OpenAITTSProvider implements Partial<AIProvider> {
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
    public model: string

    constructor(config: { apiKey: string, endpoint?: string, defaultModel?: string }) {
        this.apiKey = config.apiKey
        this.endpoint = stripTrailingSlash(config.endpoint || 'https://api.openai.com/v1')
        this.model = config.defaultModel || 'tts-1'
    }

    getVoices(_query?: TTSVoiceQuery): Promise<TTSAudioVoice[]> {
        void _query
        return Promise.resolve(this.availableVoices)
    }


    estimateTTSCost(text: string, _voice: string): Promise<number> {
        void _voice
        // OpenAI TTS 定价: $15/1M 字符 (tts-1), $30/1M 字符 (tts-1-hd)
        const chars = text.length
        const rate = this.model.includes('hd') ? 30 : 15
        return Promise.resolve((chars / 1000000) * rate)
    }

    estimateCost(text: string, voice: string): Promise<number> {
        return this.estimateTTSCost(text, voice)
    }

    async generateSpeech(
        text: string,
        voice: string,
        options: TTSOptions,
    ): Promise<ReadableStream<Uint8Array>> {
        return requestTTSAudioStream({
            endpoint: `${this.endpoint}/audio/speech`,
            apiKey: this.apiKey,
            payload: {
                model: this.model,
                input: text,
                voice,
                response_format: options.outputFormat || 'mp3',
                speed: options.speed || 1.0,
            },
            resolveErrorMessage: resolveOpenAITTSErrorMessage,
            noResponseBodyMessage: 'OpenAI TTS Error: No response body',
            requestFailedMessage: 'OpenAI TTS request failed',
        })
    }
}
