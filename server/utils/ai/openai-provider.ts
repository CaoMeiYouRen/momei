import { normalizeAspectRatio, getSemanticScale, calculateDimension } from './image-utils'
import type { AIConfig, AIChatOptions, AIChatResponse, AIChatStreamChunk, AIProvider, AIImageOptions, AIImageResponse } from '@/types/ai'

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

    async* chatStream(options: AIChatOptions): AsyncGenerator<AIChatStreamChunk, void, void> {
        const endpoint = this.config.endpoint || 'https://api.openai.com/v1'
        const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: options.model || this.config.model,
                messages: options.messages,
                temperature: options.temperature ?? this.config.temperature,
                max_tokens: options.maxTokens ?? this.config.maxTokens,
                stream: true,
            }),
        })

        if (!response.ok) {
            const rawError = await response.text().catch(() => '')

            try {
                const parsedError = JSON.parse(rawError) as { error?: { message?: string } }
                throw createError({
                    statusCode: response.status,
                    message: `OpenAI Error: ${parsedError.error?.message || response.statusText}`,
                })
            } catch {
                throw createError({
                    statusCode: response.status,
                    message: `OpenAI Error: ${rawError || response.statusText}`,
                })
            }
        }

        if (!response.body) {
            throw createError({
                statusCode: 500,
                message: 'OpenAI Error: Empty streaming response body',
            })
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let accumulatedContent = ''
        let resolvedModel = options.model || this.config.model

        const parseBlock = (block: string) => {
            const dataLines = block
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line.startsWith('data:'))
                .map((line) => line.slice(5).trim())

            if (dataLines.length === 0) {
                return {
                    shouldStop: false,
                    chunks: [] as AIChatStreamChunk[],
                }
            }

            const rawPayload = dataLines.join('\n')
            if (!rawPayload || rawPayload === '[DONE]') {
                return {
                    shouldStop: true,
                    chunks: [] as AIChatStreamChunk[],
                }
            }

            const payload = JSON.parse(rawPayload) as {
                model?: string
                choices?: {
                    delta?: { content?: string }
                    finish_reason?: string | null
                }[]
                usage?: {
                    prompt_tokens?: number
                    completion_tokens?: number
                    total_tokens?: number
                }
            }

            resolvedModel = payload.model || resolvedModel

            const delta = payload.choices?.[0]?.delta?.content || ''
            const chunks: AIChatStreamChunk[] = []
            if (delta) {
                accumulatedContent += delta
                chunks.push({
                    delta,
                    content: accumulatedContent,
                    model: resolvedModel,
                    usage: payload.usage
                        ? {
                            promptTokens: payload.usage.prompt_tokens || 0,
                            completionTokens: payload.usage.completion_tokens || 0,
                            totalTokens: payload.usage.total_tokens || 0,
                        }
                        : undefined,
                    raw: payload,
                })
            }

            return {
                shouldStop: Boolean(payload.choices?.[0]?.finish_reason),
                chunks,
            }
        }

        while (true) {
            const { value, done } = await reader.read()
            buffer += decoder.decode(value || new Uint8Array(), { stream: !done })

            const blocks = buffer.split(/\r?\n\r?\n/)
            buffer = blocks.pop() || ''

            for (const block of blocks) {
                const result = parseBlock(block)
                for (const chunk of result.chunks) {
                    yield chunk
                }

                if (result.shouldStop) {
                    return
                }
            }

            if (done) {
                break
            }
        }

        if (buffer.trim()) {
            const result = parseBlock(buffer)
            for (const chunk of result.chunks) {
                yield chunk
            }
        }
    }

    async generateImage(options: AIImageOptions): Promise<AIImageResponse> {
        const endpoint = this.config.endpoint || 'https://api.openai.com/v1'
        const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint

        // 统一映射语义化分辨率 (1K, 2K, 4K) 到像素字符串
        let finalSize = options.size
        const aspectRatio = normalizeAspectRatio(options.aspectRatio || '1:1')

        if (!finalSize || ['1K', '2K', '4K', '512px'].includes(finalSize.toUpperCase())) {
            const semanticSize = finalSize || '1K'
            const provider = (this.config.provider as string || 'openai').toLowerCase()

            // 针对 OpenAI (DALL-E 3) 的标准映射
            if (provider === 'openai') {
                // DALL-E 3 仅支持 1024 或 1792 (HD)
                if (aspectRatio === '1:1') {
                    finalSize = '1024x1024'
                } else if (aspectRatio === '16:9') {
                    finalSize = '1792x1024'
                } else if (aspectRatio === '9:16') {
                    finalSize = '1024x1792'
                } else {
                    finalSize = '1024x1024'
                }
            } else if (provider === 'doubao' || provider === 'volcengine' || provider === 'stable-diffusion') {
                // 针对兼容 OpenAI 接口的第三方高分辨率模型 (如豆包、SD 转发层)
                const scale = getSemanticScale(semanticSize)
                const base = 1024 * scale
                const { width, height } = calculateDimension(base, aspectRatio)
                finalSize = `${width}x${height}`
            } else if (aspectRatio === '1:1') {
                // 其他兼容接口默认 1K 映射
                finalSize = '1024x1024'
            } else if (aspectRatio === '16:9') {
                finalSize = '1792x1024'
            } else if (aspectRatio === '9:16') {
                finalSize = '1024x1792'
            } else {
                finalSize = '1024x1024'
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
