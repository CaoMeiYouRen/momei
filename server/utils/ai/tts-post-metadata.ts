import type { Post } from '@/server/entities/post'
import type { TTSSynthesisMode } from '@/types/ai'
import type { PostMetadata } from '@/types/post'

interface BuildTTSPostMetadataOptions {
    post: Post
    audioUrl: string
    audioSize?: number | null
    duration?: number | null
    mimeType?: string | null
    provider?: string | null
    voice?: string | null
    generatedAt?: Date | string | null
    language?: string | null
    translationId?: string | null
    mode?: TTSSynthesisMode | null
}

function resolveGeneratedAt(value?: Date | string | null) {
    if (value instanceof Date) {
        return value
    }

    if (typeof value === 'string' && value) {
        return value
    }

    return new Date()
}

function resolveMode(mode?: TTSSynthesisMode | null, fallback?: TTSSynthesisMode | null) {
    if (mode === 'speech' || mode === 'podcast') {
        return mode
    }

    if (fallback === 'speech' || fallback === 'podcast') {
        return fallback
    }

    return null
}

export function buildTTSPostMetadata(options: BuildTTSPostMetadataOptions): PostMetadata {
    const currentMetadata = options.post.metadata || {}
    const currentAudio = currentMetadata.audio || {}
    const currentTTS = currentMetadata.tts || {}
    const language = options.language ?? currentAudio.language ?? currentTTS.language ?? null
    const translationId = options.translationId ?? currentAudio.translationId ?? currentTTS.translationId ?? null
    const mode = resolveMode(options.mode, currentAudio.mode ?? currentTTS.mode ?? null)

    return {
        ...currentMetadata,
        audio: {
            ...currentAudio,
            url: options.audioUrl,
            size: options.audioSize ?? currentAudio.size ?? null,
            duration: options.duration ?? currentAudio.duration ?? null,
            mimeType: options.mimeType ?? currentAudio.mimeType ?? null,
            language,
            translationId,
            postId: options.post.id,
            mode,
        },
        tts: {
            ...currentTTS,
            provider: options.provider ?? currentTTS.provider ?? null,
            voice: options.voice ?? currentTTS.voice ?? null,
            duration: options.duration ?? currentTTS.duration ?? null,
            generatedAt: resolveGeneratedAt(options.generatedAt),
            language,
            translationId,
            postId: options.post.id,
            mode,
        },
    }
}
