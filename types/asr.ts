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

export interface StreamingConfig {
    language: string
    sampleRate: number
    encoding: 'pcm' | 'opus'
}

export interface StreamingMessageServer {
    type: 'started' | 'transcript' | 'error' | 'stopped'
    transcript?: {
        text: string
        isFinal: boolean
        confidence: number
        timestamp: number
    }
    error?: string
}

export interface ASRProvider {
    name: string
    transcribe(options: TranscribeOptions): Promise<TranscribeResponse>
}
