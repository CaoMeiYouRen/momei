import { describe, expect, it } from 'vitest'
import {
    applyPostMetadataPatch,
    applyPostReadModelFromMetadata,
    buildPostMetadataPatch,
    resolvePostPublishIntent,
} from './post-metadata'

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

    it('should apply metadata-first values on read model without clearing legacy fallback', () => {
        const post = createMockPost({
            audioUrl: '/legacy/audio.mp3',
            metadata: {
                audio: {
                    url: '/metadata/audio.mp3',
                },
            },
        })

        applyPostReadModelFromMetadata(post)

        expect(post.audioUrl).toBe('/metadata/audio.mp3')
    })

    it('should resolve publish intent from metadata first then fallback to legacy field', () => {
        const fromMetadata = resolvePostPublishIntent({
            metadata: {
                publish: {
                    intent: {
                        pushOption: 'draft',
                    },
                },
            },
            publishIntent: {
                pushOption: 'now',
            },
        })

        expect(fromMetadata.pushOption).toBe('draft')

        const fromLegacy = resolvePostPublishIntent({
            metadata: null,
            publishIntent: {
                pushOption: 'now',
            },
        })

        expect(fromLegacy.pushOption).toBe('now')
    })

    it('should keep metadata tts voice and sync full legacy shadow ttsVoice', () => {
        const longVoice = 'zh_male_dayixiansheng_v2_saturn_bigtts,zh_female_mizaitongxue_v2_saturn_bigtts'
        const post = createMockPost()

        applyPostMetadataPatch(post, {
            metadata: {
                tts: {
                    provider: 'volcengine',
                    voice: longVoice,
                    generatedAt: '2026-03-01T15:53:44.711Z',
                },
            },
        })

        expect(post.metadata?.tts?.voice).toBe(longVoice)
        expect(post.ttsVoice).toBe(longVoice)
    })
})
