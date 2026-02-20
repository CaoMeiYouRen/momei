import type { AIConfig, AIChatOptions, AIChatResponse, AIProvider, AIImageOptions, AIImageResponse, AIChatMessage } from '@/types/ai'


export interface GeminiConfig extends AIConfig {
    // 这里可以添加任何 Gemini 特有的配置项
    // 例如：projectId, location, etc. 但目前 Gemini API 主要通过 endpoint 和 apiKey 配置
    /**
     * 部分平台可能会要求添加一个额外的 API Token 放在 Authorization 用于鉴权
     */
    apiToken?: string
}

/**
 * Gemini Provider 实现
 * 支持聊天 (generateContent) 和 图像生成 (generateImage)
 */
export class GeminiProvider implements AIProvider {
    name = 'gemini'
    private config: GeminiConfig

    constructor(config: GeminiConfig) {
        this.config = config
    }

    async chat(options: AIChatOptions): Promise<AIChatResponse> {
        const endpoint = this.config.endpoint || 'https://generativelanguage.googleapis.com'
        const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint
        const model = options.model || this.config.model || 'gemini-1.5-flash'
        const apiKey = this.config.apiKey
        const apiToken = this.config.apiToken
        try {
            const contents = options.messages.map((msg: AIChatMessage) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            }))

            const response = await $fetch<any>(`${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 如果有额外的 API Token，添加到 Authorization
                    ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
                },
                body: {
                    contents,
                    generationConfig: {
                        temperature: options.temperature ?? this.config.temperature,
                        maxOutputTokens: options.maxTokens ?? this.config.maxTokens,
                    },
                },
            })

            const candidate = response.candidates?.[0]
            const content = candidate?.content?.parts?.[0]?.text || ''

            return {
                content,
                model: response.modelVersion || model,
                usage: response.usageMetadata
                    ? {
                        promptTokens: response.usageMetadata.promptTokenCount,
                        completionTokens: response.usageMetadata.candidatesTokenCount,
                        totalTokens: response.usageMetadata.totalTokenCount,
                    }
                    : undefined,
                raw: response,
            }
        } catch (error: any) {
            const status = error.statusCode || error.response?.status || 500
            const message = error.data?.error?.message || error.message || 'Gemini API request failed'

            throw createError({
                statusCode: status,
                message: `Gemini Error: ${message}`,
            })
        }
    }

    async generateImage(options: AIImageOptions): Promise<AIImageResponse> {
        const endpoint = this.config.endpoint || 'https://generativelanguage.googleapis.com'
        const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint
        const model = options.model || this.config.model || 'imagen-3.0-generate-001'
        const apiKey = this.config.apiKey
        const apiToken = this.config.apiToken
        try {
            const response = await $fetch<any>(`${baseUrl}/v1beta/models/${model}:generateImage?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 如果有额外的 API Token，添加到 Authorization
                    ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
                },
                body: {
                    prompt: {
                        text: options.prompt,
                    },
                    imageGenerationParams: {
                        numberOfImages: options.n || 1,
                        aspectRatio: this.mapAspectRatio(options.aspectRatio || '1:1'),
                        // quality/style mapping
                        addWatermark: false, // Default to false for better integration
                    },
                    safetySettings: [
                        {
                            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                            threshold: 'BLOCK_LOW_AND_ABOVE',
                        },
                        {
                            category: 'HARM_CATEGORY_HATE_SPEECH',
                            threshold: 'BLOCK_LOW_AND_ABOVE',
                        },
                        {
                            category: 'HARM_CATEGORY_HARASSMENT',
                            threshold: 'BLOCK_LOW_AND_ABOVE',
                        },
                        {
                            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                            threshold: 'BLOCK_LOW_AND_ABOVE',
                        },
                    ],
                },
            })

            if (!response.generatedImages || response.generatedImages.length === 0) {
                throw new Error('No images generated by Gemini')
            }

            return {
                images: response.generatedImages.map((img: any) => ({
                    url: img.bytesBase64Encoded
                        ? `data:image/png;base64,${img.bytesBase64Encoded}`
                        : img.imageUri,
                })),
                model,
                raw: response,
            }
        } catch (error: any) {
            const status = error.statusCode || error.response?.status || 500
            const message = error.data?.error?.message || error.message || 'Gemini Image API request failed'

            throw createError({
                statusCode: status,
                message: `Gemini Image Error: ${message}`,
            })
        }
    }

    private mapAspectRatio(ratio: string): string {
        // Gemini Imagen 3 supports specific aspect ratios
        switch (ratio) {
            case '1:1': return '1:1'
            case '16:9': return '16:9'
            case '9:16': return '9:16'
            case '4:3': return '4:3'
            case '3:4': return '3:4'
            default: return '1:1'
        }
    }

    async check?(): Promise<boolean> {
        // Simple connectivity check (list models)
        const endpoint = this.config.endpoint || 'https://generativelanguage.googleapis.com'
        const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint
        try {
            await $fetch(`${baseUrl}/v1beta/models?key=${this.config.apiKey}`)
            return true
        } catch {
            return false
        }
    }
}
