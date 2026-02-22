import { describe, expect, it } from 'vitest'
import { applyPostMetadataPatch, buildPostMetadataPatch } from './post-metadata'

function createMockPost(overrides: Record<string, unknown> = {}) {
    return {
        metadata: null,
        metaVersion: 0,
        audioUrl: null,
        audioDuration: null,
        audioSize: null,
        audioMimeType: null,
        ttsProvider: null,
        ttsVoice: null,
        ttsGeneratedAt: null,
        scaffoldOutline: null,
        scaffoldMetadata: null,
        publishIntent: null,
        memosId: null,
        ...overrides,
    } as any
}

describe('server/utils/post-metadata', () => {
    it('should build metadata patch from legacy flat fields', () => {
        const patch = buildPostMetadataPatch({
            audioUrl: '/uploads/audio.mp3',
            audioDuration: 120,
            audioSize: 1024,
            audioMimeType: 'audio/mpeg',
        })

        expect(patch).toEqual({
            audio: {
                url: '/uploads/audio.mp3',
                duration: 120,
                size: 1024,
                mimeType: 'audio/mpeg',
            },
        })
    })

    it('should merge metadata patch and sync shadow fields', () => {
        const post = createMockPost({
            metadata: {
                publish: {
                    intent: {
                        syncToMemos: false,
                        pushOption: 'none',
                    },
                },
            },
        })

        applyPostMetadataPatch(post, {
            metadata: {
                audio: {
                    url: '/uploads/new.mp3',
                    duration: 66,
                    size: 2048,
                    mimeType: 'audio/mp3',
                },
            },
        })

        expect(post.metadata).toEqual({
            publish: {
                intent: {
                    syncToMemos: false,
                    pushOption: 'none',
                },
            },
            audio: {
                url: '/uploads/new.mp3',
                duration: 66,
                size: 2048,
                mimeType: 'audio/mp3',
            },
        })

        expect(post.audioUrl).toBe('/uploads/new.mp3')
        expect(post.audioDuration).toBe(66)
        expect(post.audioSize).toBe(2048)
        expect(post.audioMimeType).toBe('audio/mp3')
        expect(post.metaVersion).toBe(1)
    })

    it('should clear metadata and shadow fields when metadata is null', () => {
        const post = createMockPost({
            metadata: {
                audio: { url: '/uploads/new.mp3' },
                scaffold: { outline: 'outline' },
            },
            audioUrl: '/uploads/new.mp3',
            scaffoldOutline: 'outline',
        })

        applyPostMetadataPatch(post, { metadata: null })

        expect(post.metadata).toBeNull()
        expect(post.audioUrl).toBeNull()
        expect(post.scaffoldOutline).toBeNull()
    })
})
