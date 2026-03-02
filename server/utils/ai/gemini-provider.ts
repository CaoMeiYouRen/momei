import type { AIConfig, AIChatOptions, AIChatResponse, AIProvider, AIImageOptions, AIImageResponse, AIChatMessage } from '@/types/ai'


export interface GeminiConfig extends AIConfig {
    // 这里可以添加任何 Gemini 特有的配置项
    // 例如：projectId, location, etc. 但目前 Gemini API 主要通过 endpoint 和 apiKey 配置
    /**
     * 部分代理平台可能会要求添加一个额外的 API Token 放在 Authorization 用于鉴权
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
            const systemMessages = options.messages.filter((msg: AIChatMessage) => msg.role === 'system')
            const conversationMessages = options.messages.filter((msg: AIChatMessage) => msg.role !== 'system')

            const contents = conversationMessages.map((msg: AIChatMessage) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            }))

            const systemInstruction = systemMessages.length > 0
                ? {
                    parts: [{
                        text: systemMessages.map((message) => message.content).join('\n'),
                    }],
                }
                : undefined

            const response = await $fetch<any>(`${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 如果有额外的 API Token，添加到 Authorization
                    ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
                },
                body: {
                    ...(systemInstruction ? { systemInstruction } : {}),
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
            const useGenerateContentApi = this.shouldUseGenerateContentForImage(model)
            const response = await $fetch<any>(
                `${baseUrl}/v1beta/models/${model}:${useGenerateContentApi ? 'generateContent' : 'generateImage'}?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // 如果有额外的 API Token，添加到 Authorization
                        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
                    },
                    body: useGenerateContentApi
                        ? {
                            contents: [
                                {
                                    role: 'user',
                                    parts: [{ text: options.prompt }],
                                },
                            ],
                            generationConfig: {
                                responseModalities: ['IMAGE'],
                                imageConfig: {
                                    aspect_ratio: this.mapAspectRatio(options.aspectRatio || '1:1'),
                                    image_size: this.mapImageSize(options.size || '1K'),
                                },
                            },
                        }
                        : {
                            prompt: {
                                text: options.prompt,
                            },
                            imageGenerationParams: {
                                numberOfImages: options.n || 1,
                                aspect_ratio: this.mapAspectRatio(options.aspectRatio || '1:1'),
                                addWatermark: false,
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

            const candidate = response.candidates?.[0]
            if (candidate?.finishReason === 'SAFETY') {
                throw createError({
                    statusCode: 400,
                    message: 'Gemini Image Error: Image generation blocked by safety filters.',
                })
            }

            const imageUrls = this.extractImageUrlsFromResponse(response)
            if (imageUrls.length === 0) {
                throw new Error('No images generated by Gemini')
            }

            return {
                images: imageUrls.map((url) => ({ url })),
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
        // Gemini 支持多种宽高比，确保大小写和格式正确
        const validRatios = [
            '1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '8:1', '9:16', '16:9', '21:9',
        ]
        const normalized = ratio.replace(/\s+/g, '')
        return validRatios.includes(normalized) ? normalized : '1:1'
    }

    private mapImageSize(size: string): string {
        // Gemini 3 支持的可选分辨率标识符 (大写 K)
        const validSizes = ['512px', '1K', '2K', '4K']
        const upperSize = size.toUpperCase()

        if (validSizes.includes(upperSize)) {
            return upperSize
        }

        // 处理形如 '1024x1024' 的传统格式，尝试映射到 1K 等
        if (size.includes('1024')) { return '1K' }
        if (size.includes('2048')) { return '2K' }
        if (size.includes('4096')) { return '4K' }
        if (size.includes('512')) { return '512px' }

        return '1K' // 默认 1K
    }

    private shouldUseGenerateContentForImage(model: string): boolean {
        // 只有 imagen 系列使用 generateImage，Gemini 3 系列使用 generateContent
        const m = model.toLowerCase()
        return m.includes('gemini') || !m.startsWith('imagen')
    }

    private extractImageUrlsFromResponse(response: any): string[] {
        if (Array.isArray(response?.generatedImages) && response.generatedImages.length > 0) {
            return response.generatedImages
                .map((img: any) => {
                    const base64Data = img?.bytesBase64Encoded
                    if (typeof base64Data === 'string' && base64Data.length > 0) {
                        return `data:image/png;base64,${base64Data}`
                    }
                    const imageUri = img?.imageUri
                    return typeof imageUri === 'string' ? imageUri : ''
                })
                .filter((url: string) => url.length > 0)
        }

        const candidateParts = response?.candidates?.[0]?.content?.parts
        if (!Array.isArray(candidateParts)) {
            return []
        }

        return candidateParts
            .map((part: any) => {
                const inlineData = part?.inlineData || part?.inline_data
                const base64Data = inlineData?.data
                if (typeof base64Data === 'string' && base64Data.length > 0) {
                    const mimeType = inlineData?.mimeType || inlineData?.mime_type || 'image/png'
                    return `data:${mimeType};base64,${base64Data}`
                }

                const imageUri = part?.imageUri || part?.image_uri
                if (typeof imageUri === 'string' && imageUri.length > 0) {
                    return imageUri
                }
                return ''
            })
            .filter((url: string) => url.length > 0)
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
