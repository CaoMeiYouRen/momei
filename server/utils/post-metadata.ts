import type { Post } from '@/server/entities/post'
import type { PostMetadata, PublishIntent } from '@/types/post'

interface PostMetadataInput {
    metadata?: PostMetadata | null
    metaVersion?: number
}

interface PostIntentCarrier {
    metadata?: PostMetadata | null
    publishIntent?: PublishIntent | null
}

interface LegacyPostReadModelCarrier extends PostIntentCarrier {
    audioUrl?: string | null
    audioDuration?: number | null
    audioSize?: number | null
    audioMimeType?: string | null
    memosId?: string | null
    translations?: unknown[] | null
}

function isLegacyPostReadModelCarrier(value: unknown): value is LegacyPostReadModelCarrier {
    return Boolean(value) && typeof value === 'object'
}

export function applyPostReadModelFromMetadata(post?: unknown) {
    if (!isLegacyPostReadModelCarrier(post)) {
        return
    }

    const metadata = post.metadata
    if (!metadata || typeof metadata !== 'object') {
        return
    }

    if (metadata.audio && typeof metadata.audio === 'object') {
        post.audioUrl = metadata.audio.url ?? post.audioUrl ?? null
        post.audioDuration = metadata.audio.duration ?? post.audioDuration ?? null
        post.audioSize = metadata.audio.size ?? post.audioSize ?? null
        post.audioMimeType = metadata.audio.mimeType ?? post.audioMimeType ?? null
    }

    const publishIntent = metadata.publish?.intent
    if (publishIntent !== undefined) {
        post.publishIntent = publishIntent ?? null
    }

    const memosId = metadata.integration?.memosId
    if (memosId !== undefined) {
        post.memosId = memosId ?? null
    }

    if (Array.isArray(post.translations)) {
        post.translations.forEach((translation) => applyPostReadModelFromMetadata(translation))
    }
}

export function applyPostsReadModelFromMetadata(posts?: unknown[]) {
    if (!Array.isArray(posts)) {
        return
    }

    posts.forEach((post) => applyPostReadModelFromMetadata(post))
}

export function resolvePostPublishIntent(post: PostIntentCarrier): PublishIntent {
    const metadataIntent = post.metadata?.publish?.intent
    if (metadataIntent) {
        return metadataIntent
    }
    return {}
}

export function applyPostMetadataPatch(post: Post, input: PostMetadataInput) {
    if (input.metadata !== undefined) {
        post.metadata = input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : null
        if (post.metadata && !post.metaVersion) {
            post.metaVersion = 1
        }
    }

    if (input.metaVersion !== undefined) {
        post.metaVersion = input.metaVersion
    }
}
