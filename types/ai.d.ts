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
    generateImage?(options: AIImageOptions): Promise<AIImageResponse>
    check(): Promise<boolean>
}

export type AIProviderType = 'openai' | 'anthropic' | 'gemini' | 'stable-diffusion' | 'doubao'

export interface AIImageOptions {
    prompt: string
    model?: string
    size?: string // e.g., '1024x1024'
    aspectRatio?: string // e.g., '1:1', '16:9', '9:16'
    quality?: 'standard' | 'hd'
    style?: 'vivid' | 'natural'
    n?: number // Number of images to generate
}

export interface AIImageResponse {
    images: {
        url: string
        revisedPrompt?: string
    }[]
    usage?: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
    model?: string
}

export interface AIConfig {
    enabled: boolean
    provider: AIProviderType
    apiKey: string
    model: string
    endpoint?: string
    maxTokens?: number
    temperature?: number
}

export type AIImageConfig = AIConfig
