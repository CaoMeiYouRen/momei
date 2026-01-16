import type { AIConfig, AIChatOptions, AIChatResponse, AIProvider } from '@/types/ai'

export class AnthropicProvider implements AIProvider {
    name = 'anthropic'
    private config: AIConfig

    constructor(config: AIConfig) {
        this.config = config
    }

    async chat(options: AIChatOptions): Promise<AIChatResponse> {
        const endpoint = this.config.endpoint || 'https://api.anthropic.com/v1'
        const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint

        try {
            const response = await $fetch<any>(`${baseUrl}/messages`, {
                method: 'POST',
                headers: {
                    'x-api-key': this.config.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
                body: {
                    model: options.model || this.config.model,
                    messages: options.messages.filter((m) => m.role !== 'system'),
                    system: options.messages.find((m) => m.role === 'system')?.content,
                    max_tokens: options.maxTokens ?? this.config.maxTokens,
                    temperature: options.temperature ?? this.config.temperature,
                    stream: options.stream ?? false,
                },
            })

            // Anthropic response format differs from OpenAI
            // content is an array of blocks
            const content = response.content
                .filter((block: any) => block.type === 'text')
                .map((block: any) => block.text)
                .join('\n')

            return {
                content,
                model: response.model,
                usage: response.usage
                    ? {
                        promptTokens: response.usage.input_tokens,
                        completionTokens: response.usage.output_tokens,
                        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
                    }
                    : undefined,
                raw: response,
            }
        } catch (error: any) {
            const status = error.statusCode || error.response?.status || 500
            const message = error.data?.error?.message || error.message || 'Anthropic API request failed'

            throw createError({
                statusCode: status,
                message: `Anthropic Error: ${message}`,
            })
        }
    }
}
