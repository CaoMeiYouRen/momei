import type { ASRProvider, TranscribeOptions, TranscribeResponse } from '~/types/asr'

export class SiliconFlowASRProvider implements ASRProvider {
    name = 'siliconflow'
    private apiKey: string
    private endpoint: string
    private model: string

    constructor(apiKey: string, endpoint: string = 'https://api.siliconflow.cn/v1', model: string = 'FunAudioLLM/SenseVoiceSmall') {
        this.apiKey = apiKey
        this.endpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint
        this.model = model
    }

    async transcribe(options: TranscribeOptions): Promise<TranscribeResponse> {
        const formData = new FormData()

        // Create a Blob from the Buffer
        // Important: Buffer needs to be converted to Uint8Array for Blob in some environments
        const uint8Array = new Uint8Array(options.audioBuffer)
        const blob = new Blob([uint8Array], { type: options.mimeType })
        formData.append('file', blob, options.fileName)
        formData.append('model', options.model || this.model)

        if (options.language) {
            formData.append('language', options.language)
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
                language: options.language || 'auto',
                duration: response.duration || 0,
                confidence: 1.0,
                usage: {
                    audioSeconds: response.duration || 0,
                },
            }
        } catch (error: any) {
            const status = error.statusCode || error.response?.status || 500
            const message = error.data?.error?.message || error.message || 'SiliconFlow ASR request failed'

            throw createError({
                statusCode: status,
                message: `SiliconFlow Error: ${message}`,
            })
        }
    }
}
