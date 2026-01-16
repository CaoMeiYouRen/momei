import type { AIConfig, AIChatOptions, AIChatResponse, AIProvider } from '@/types/ai'

export class OpenAIProvider implements AIProvider {
    name = 'openai'
    private config: AIConfig

    constructor(config: AIConfig) {
        this.config = config
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
}
