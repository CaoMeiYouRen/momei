// --- Categories ---
export type AICategory = 'text' | 'image' | 'tts' | 'asr' | 'video'

export type AIRole = 'system' | 'user' | 'assistant'

// --- Text/Chat ---
// ... (rest of the file)
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

// --- Image ---
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

// --- TTS (Text to Speech) ---
export interface TTSAudioVoice {
    id: string
    name: string
    language: string
    gender: 'male' | 'female' | 'neutral'
    mode?: 'speech' | 'podcast'
    previewUrl?: string
}

export interface TTSOptions {
    mode?: 'speech' | 'podcast'
    speed?: number
    pitch?: number
    volume?: number
    language?: string
    model?: string
    sampleRate?: number
    outputFormat?: string
    skipRecording?: boolean
}

// --- ASR (Speech to Text) ---
export interface TranscribeOptions {
    audioBuffer: Buffer
    fileName: string
    mimeType: string
    language?: string
    prompt?: string
    model?: string
}

export interface TranscribeResponse {
    text: string
    language: string
    duration: number
    confidence: number
    usage: {
        audioSeconds: number
    }
}

// --- Providers ---
export interface AIProvider {
    name: string
    // Text
    chat?(options: AIChatOptions): Promise<AIChatResponse>
    // Image
    generateImage?(options: AIImageOptions): Promise<AIImageResponse>
    // TTS
    getVoices?(): Promise<TTSAudioVoice[]>
    generateSpeech?(text: string, voice: string | string[], options: TTSOptions): Promise<ReadableStream<Uint8Array>>
    estimateTTSCost?(text: string, voice: string | string[]): Promise<number>
    // ASR
    transcribe?(options: TranscribeOptions): Promise<TranscribeResponse>
    // General
    check?(): Promise<boolean>
}

// --- Configs ---
export type AIProviderType = 'openai' | 'anthropic' | 'gemini' | 'stable-diffusion' | 'doubao' | 'siliconflow' | 'volcengine' | 'deepseek'

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
export type AITTSConfig = AIConfig
export type AIASRConfig = AIConfig
