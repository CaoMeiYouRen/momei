import { describe, expect, it } from 'vitest'
import {
    applyPostMetadataPatch,
    applyPostReadModelFromMetadata,
    applyPostsReadModelFromMetadata,
    resolvePostPublishIntent,
} from './post-metadata'

function createMockPost(overrides: Record<string, unknown> = {}) {
    return {
        metadata: null,
        metaVersion: 0,
        ...overrides,
    } as any
}

describe('server/utils/post-metadata', () => {
    it('should apply metadata patch', () => {
        const post = createMockPost()
        const metadata = {
            audio: { url: 'https://example.com/audio.mp3' },
        }
        applyPostMetadataPatch(post, { metadata })
        expect(post.metadata.audio.url).toBe('https://example.com/audio.mp3')
        expect(post.metaVersion).toBe(1)
    })

    it('should resolve publish intent', () => {
        const intent = { pushOption: 'draft' } as any
        const result = resolvePostPublishIntent({
            metadata: {
                publish: { intent },
            },
        })
        expect(result.pushOption).toBe('draft')
    })

    it('should skip non-carrier and non-array inputs without writing read-model fields', () => {
        const invalidMetadataPost = createMockPost({ metadata: 'not-an-object' })
        applyPostReadModelFromMetadata(invalidMetadataPost)
        expect(invalidMetadataPost.publishIntent).toBeUndefined()
        expect(invalidMetadataPost.memosId).toBeUndefined()
        expect(invalidMetadataPost.audioUrl).toBeUndefined()

        const arrayItem = createMockPost({ metadata: null })
        applyPostsReadModelFromMetadata([arrayItem])
        expect(arrayItem.publishIntent).toBeUndefined()

        expect(() => applyPostReadModelFromMetadata(null)).not.toThrow()
        expect(() => applyPostsReadModelFromMetadata(undefined)).not.toThrow()
        expect(() => applyPostsReadModelFromMetadata({} as never)).not.toThrow()
    })

    it('should project publish intent / memos id / translations onto read model', () => {
        const post = createMockPost({
            metadata: {
                publish: { intent: null },
                integration: { memosId: 'memos-1' },
            },
            translations: [
                { metadata: { audio: { url: 'https://example.com/a.mp3', duration: 12 } } },
            ],
        })

        applyPostReadModelFromMetadata(post)

        expect(post.publishIntent).toBeNull()
        expect(post.memosId).toBe('memos-1')
        expect(post.translations[0].audioUrl).toBe('https://example.com/a.mp3')
        expect(post.translations[0].audioDuration).toBe(12)
    })

    it('should fall back to empty publish intent when metadata is absent', () => {
        expect(resolvePostPublishIntent({ metadata: null } as never)).toEqual({})
    })

    it('should apply metaVersion patch independently', () => {
        const post = createMockPost()

        applyPostMetadataPatch(post, { metaVersion: 3 })

        expect(post.metaVersion).toBe(3)
        expect(post.metadata).toBeNull()
    })

})
