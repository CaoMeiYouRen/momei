import type { AIProvider, TranscribeOptions, TranscribeResponse } from '@/types/ai'

export class SiliconFlowASRProvider implements Partial<AIProvider> {
    name = 'siliconflow'
    private apiKey: string
    private endpoint: string
    public model: string

    constructor(apiKey: string, endpoint: string = 'https://api.siliconflow.cn/v1', model: string = 'FunAudioLLM/SenseVoiceSmall') {
        this.apiKey = apiKey
        this.endpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint
        this.model = model
    }

    async transcribe(options: TranscribeOptions): Promise<TranscribeResponse> {
        const formData = new FormData()

        // Normalize language for SiliconFlow (expects 2-letter codes for most part)
        let normalizedLang = options.language
        if (normalizedLang) {
            const parts = normalizedLang.split(/[-_]/)
            normalizedLang = parts[0]?.toLowerCase() || normalizedLang
        }

        // Create a Blob from the Buffer
        // Important: Buffer needs to be converted to Uint8Array for Blob in some environments
        const uint8Array = new Uint8Array(options.audioBuffer)
        const blob = new Blob([uint8Array], { type: options.mimeType })
        formData.append('file', blob, options.fileName)
        formData.append('model', options.model || this.model)

        if (normalizedLang) {
            formData.append('language', normalizedLang)
        }
        if (options.prompt) {
            formData.append('prompt', options.prompt)
        }

        try {
            const response = await $fetch<any>(`${this.endpoint}/audio/transcriptions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: formData,
            })

            return {
                text: response.text,
                language: normalizedLang || 'auto',
                duration: response.duration || 0,
                confidence: 1.0,
                usage: {
                    audioSeconds: response.duration || 0,
                },
            }
        } catch (error: any) {
            const status = error.statusCode || error.response?.status || 500
            const message = error.data?.error?.message || error.message || 'SiliconFlow ASR request failed'
            const detail = error.data ? JSON.stringify(error.data) : ''

            console.error('[ASR-SiliconFlow] Error Response:', detail)

            throw createError({
                statusCode: status,
                message: `SiliconFlow Error: ${message}${detail ? ` - ${detail}` : ''}`,
            })
        }
    }
}
