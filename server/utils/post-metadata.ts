import type { Post } from '@/server/entities/post'
import type { PostMetadata, PublishIntent } from '@/types/post'

interface PostMetadataInput {
    metadata?: PostMetadata | null
    metaVersion?: number
    audioUrl?: string | null
    audioDuration?: number | null
    audioSize?: number | null
    audioMimeType?: string | null
    ttsProvider?: string | null
    ttsVoice?: string | null
    ttsGeneratedAt?: Date | null
    scaffoldOutline?: string | null
    scaffoldMetadata?: Record<string, unknown> | null
    publishIntent?: PublishIntent | null
    memosId?: string | null
}

interface PostIntentCarrier {
    metadata?: PostMetadata | null
    publishIntent?: PublishIntent | null
}

type PostMetadataPatch = Partial<PostMetadata> | null

const LEGACY_TTS_PROVIDER_MAX_LENGTH = 50
const LEGACY_TTS_VOICE_MAX_LENGTH = 50

function clampLegacyText(value: string | null | undefined, maxLength: number): string | null {
    if (typeof value !== 'string') {
        return null
    }
    return value.length > maxLength ? value.slice(0, maxLength) : value
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return Object.prototype.toString.call(value) === '[object Object]'
}

function cloneValue<T>(value: T): T {
    if (value === undefined || value === null) {
        return value
    }
    return structuredClone(value)
}

function deepMerge<T>(base: T, patch: unknown): T {
    if (patch === undefined) {
        return base
    }

    if (patch === null) {
        return null as T
    }

    if (Array.isArray(patch)) {
        return cloneValue(patch) as T
    }

    if (!isPlainObject(patch)) {
        return patch as T
    }

    const source = isPlainObject(base) ? { ...base as Record<string, unknown> } : {}

    for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) {
            continue
        }
        const current = source[key]
        source[key] = deepMerge(current as never, value)
    }

    return source as T
}

function setPatchValue<T extends object>(
    patch: T,
    groupKey: keyof T,
    fieldKey: string,
    value: unknown,
) {
    if (value === undefined) {
        return
    }

    const group = (patch[groupKey] as Record<string, unknown> | undefined) || {}
    group[fieldKey] = value
    patch[groupKey] = group as T[keyof T]
}

function applyShadowFieldsFromMetadata(post: Post, metadata: PostMetadata | null, options: { clearWhenMetadataNull: boolean }) {
    if (metadata === null) {
        if (options.clearWhenMetadataNull) {
            post.audioUrl = null
            post.audioDuration = null
            post.audioSize = null
            post.audioMimeType = null
            post.ttsProvider = null
            post.ttsVoice = null
            post.ttsGeneratedAt = null
            post.scaffoldOutline = null
            post.scaffoldMetadata = null
            post.publishIntent = null
            post.memosId = null
        }
        return
    }

    if (!metadata) {
        return
    }

    if (Object.prototype.hasOwnProperty.call(metadata, 'audio')) {
        const audio = metadata.audio
        post.audioUrl = audio?.url ?? null
        post.audioDuration = audio?.duration ?? null
        post.audioSize = audio?.size ?? null
        post.audioMimeType = audio?.mimeType ?? null
    }

    if (Object.prototype.hasOwnProperty.call(metadata, 'tts')) {
        const tts = metadata.tts
        post.ttsProvider = clampLegacyText(tts?.provider, LEGACY_TTS_PROVIDER_MAX_LENGTH)
        post.ttsVoice = clampLegacyText(tts?.voice, LEGACY_TTS_VOICE_MAX_LENGTH)
        post.ttsGeneratedAt = tts?.generatedAt ? new Date(tts.generatedAt) : null
    }

    if (Object.prototype.hasOwnProperty.call(metadata, 'scaffold')) {
        const scaffold = metadata.scaffold
        post.scaffoldOutline = scaffold?.outline ?? null
        post.scaffoldMetadata = scaffold?.metadata ?? null
    }

    if (Object.prototype.hasOwnProperty.call(metadata, 'publish')) {
        post.publishIntent = metadata.publish?.intent ?? null
    }

    if (Object.prototype.hasOwnProperty.call(metadata, 'integration')) {
        post.memosId = metadata.integration?.memosId ?? null
    }
}

export function applyPostReadModelFromMetadata(post: Post) {
    applyShadowFieldsFromMetadata(post, post.metadata || null, {
        clearWhenMetadataNull: false,
    })
}

export function applyPostsReadModelFromMetadata(posts: Post[]) {
    for (const post of posts) {
        applyPostReadModelFromMetadata(post)
    }
}

export function resolvePostPublishIntent(post: PostIntentCarrier): PublishIntent {
    const metadataIntent = post.metadata?.publish?.intent
    if (metadataIntent) {
        return metadataIntent
    }
    return post.publishIntent || {}
}

export function buildPostMetadataPatch(input: PostMetadataInput): PostMetadataPatch | undefined {
    const patch: Partial<PostMetadata> = {}

    if (input.metadata !== undefined) {
        if (input.metadata === null) {
            return null
        }
        Object.assign(patch, cloneValue(input.metadata))
    }

    setPatchValue(patch, 'audio', 'url', input.audioUrl)
    setPatchValue(patch, 'audio', 'duration', input.audioDuration)
    setPatchValue(patch, 'audio', 'size', input.audioSize)
    setPatchValue(patch, 'audio', 'mimeType', input.audioMimeType)

    setPatchValue(patch, 'tts', 'provider', input.ttsProvider)
    setPatchValue(patch, 'tts', 'voice', input.ttsVoice)
    setPatchValue(patch, 'tts', 'generatedAt', input.ttsGeneratedAt?.toISOString() || input.ttsGeneratedAt)

    setPatchValue(patch, 'scaffold', 'outline', input.scaffoldOutline)
    setPatchValue(patch, 'scaffold', 'metadata', input.scaffoldMetadata)

    if (input.publishIntent !== undefined) {
        const publish = patch.publish || {}
        patch.publish = {
            ...publish,
            intent: cloneValue(input.publishIntent),
        }
    }

    if (input.memosId !== undefined) {
        const integration = patch.integration || {}
        patch.integration = {
            ...integration,
            memosId: input.memosId,
        }
    }

    return Object.keys(patch).length > 0 ? patch : undefined
}

export function applyPostMetadataPatch(post: Post, input: PostMetadataInput) {
    const patch = buildPostMetadataPatch(input)
    if (patch === undefined && input.metaVersion === undefined) {
        return
    }

    if (patch !== undefined) {
        post.metadata = patch === null
            ? null
            : deepMerge<PostMetadata>(cloneValue(post.metadata) || {} as PostMetadata, patch)

        applyShadowFieldsFromMetadata(post, post.metadata, {
            clearWhenMetadataNull: true,
        })

        if (post.metadata && !post.metaVersion) {
            post.metaVersion = 1
        }
    }

    if (input.metaVersion !== undefined) {
        post.metaVersion = input.metaVersion
    }
}
