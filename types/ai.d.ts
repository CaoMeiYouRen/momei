export type AIRole = 'system' | 'user' | 'assistant'

export interface AIChatMessage {
    role: AIRole
    content: string
}

export interface AIChatOptions {
    model?: string
    messages: AIChatMessage[]
    temperature?: number
    maxTokens?: number
    stream?: boolean
}

export interface AIChatResponse {
    content: string
    model: string
    usage?: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
    raw?: any
}

export interface AIProvider {
    name: string
    chat(options: AIChatOptions): Promise<AIChatResponse>
    check(): Promise<boolean>
}

export type AIProviderType = 'openai' | 'anthropic'

export interface AIConfig {
    enabled: boolean
    provider: AIProviderType
    apiKey: string
    model: string
    endpoint?: string
    maxTokens?: number
    temperature?: number
}
