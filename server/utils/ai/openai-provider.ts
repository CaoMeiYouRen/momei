import type { AIConfig, AIChatOptions, AIChatResponse, AIProvider, AIImageOptions, AIImageResponse } from '@/types/ai'

export class OpenAIProvider implements AIProvider {
    name = 'openai'
    private config: AIConfig

    constructor(config: AIConfig) {
        this.config = config
        if (config.provider) {
            this.name = config.provider
        }
    }

    async chat(options: AIChatOptions): Promise<AIChatResponse> {
        const endpoint = this.config.endpoint || 'https://api.openai.com/v1'
        const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint

        try {
            const response = await $fetch<any>(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: {
                    model: options.model || this.config.model,
                    messages: options.messages,
                    temperature: options.temperature ?? this.config.temperature,
                    max_tokens: options.maxTokens ?? this.config.maxTokens,
                    stream: options.stream ?? false,
                },
            })

            return {
                content: response.choices[0].message.content,
                model: response.model,
                usage: response.usage
                    ? {
                        promptTokens: response.usage.prompt_tokens,
                        completionTokens: response.usage.completion_tokens,
                        totalTokens: response.usage.total_tokens,
                    }
                    : undefined,
                raw: response,
            }
        } catch (error: any) {
            const status = error.statusCode || error.response?.status || 500
            const message = error.data?.error?.message || error.message || 'OpenAI API request failed'

            throw createError({
                statusCode: status,
                message: `OpenAI Error: ${message}`,
            })
        }
    }

    async generateImage(options: AIImageOptions): Promise<AIImageResponse> {
        const endpoint = this.config.endpoint || 'https://api.openai.com/v1'
        const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint

        // 解析尺寸和宽高比
        let finalSize = options.size
        if (!finalSize && options.aspectRatio) {
            const provider = (this.config.provider as string || 'openai').toLowerCase()
            // 针对不同提供商映射最佳分辨率
            // 注意：某些提供商（如字节跳动/豆包）在 OpenAI 兼容模式下对某些模型有最小像素要求（如 3.68M 像素）
            if (provider === 'doubao' || provider === 'stable-diffusion') {
                switch (options.aspectRatio) {
                    case '1:1':
                        finalSize = '2048x2048'
                        break
                    case '16:9':
                        finalSize = '2560x1440'
                        break
                    case '4:3':
                        finalSize = '2048x1536'
                        break
                    case '3:2':
                        finalSize = '2048x1365'
                        break
                    case '9:16':
                        finalSize = '1440x2560'
                        break
                    default:
                        finalSize = '2048x2048'
                }
            } else {
                // OpenAI DALL-E 3 标准尺寸
                switch (options.aspectRatio) {
                    case '1:1':
                        finalSize = '1024x1024'
                        break
                    case '16:9':
                        finalSize = '1792x1024'
                        break
                    case '9:16':
                        finalSize = '1024x1792'
                        break
                    default:
                        finalSize = '1024x1024'
                }
            }
        }

        try {
            const response = await $fetch<any>(`${baseUrl}/images/generations`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: {
                    model: options.model || this.config.model || 'dall-e-3',
                    prompt: options.prompt,
                    n: options.n ?? 1,
                    size: finalSize || '1024x1024',
                    quality: options.quality ?? 'standard',
                    style: options.style ?? 'vivid',
                },
            })

            return {
                images: response.data.map((item: any) => ({
                    url: item.url,
                    revisedPrompt: item.revised_prompt,
                })),
            }
        } catch (error: any) {
            const status = error.statusCode || error.response?.status || 500
            const message = error.data?.error?.message || error.message || 'OpenAI Image Generation failed'

            throw createError({
                statusCode: status,
                message: `OpenAI Image Error: ${message}`,
            })
        }
    }

    async check(): Promise<boolean> {
        const endpoint = this.config.endpoint || 'https://api.openai.com/v1'
        const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint

        try {
            await $fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: {
                    model: this.config.model,
                    messages: [{ role: 'user', content: 'hi' }],
                    max_tokens: 1,
                },
            })
            return true
        } catch {
            return false
        }
    }
}
