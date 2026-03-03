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

export function applyPostReadModelFromMetadata(post?: unknown) {
    void post
    // metadata is now the source of truth
}

export function applyPostsReadModelFromMetadata(posts?: unknown[]) {
    void posts
    applyPostReadModelFromMetadata()
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
