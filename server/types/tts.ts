export interface TTSAudioVoice {
    id: string
    name: string
    language: string
    gender: 'male' | 'female' | 'neutral'
    mode?: 'speech' | 'podcast' // 某些音色仅适用于特定模式
    previewUrl?: string
}

export interface TTSOptions {
    mode: 'speech' | 'podcast'
    speed?: number
    pitch?: number
    outputFormat?: 'mp3' | 'opus' | 'aac'
}

export interface TTSProvider {
    name: string
    availableVoices: TTSAudioVoice[]
    getVoices(): Promise<TTSAudioVoice[]>
    estimateCost(text: string, voice: string | string[]): Promise<number>
    generateSpeech(
        text: string,
        voice: string | string[],
        options: TTSOptions
    ): Promise<ReadableStream<Uint8Array>>
}
