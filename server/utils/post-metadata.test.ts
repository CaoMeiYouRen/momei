import { describe, expect, it } from 'vitest'
import {
    applyPostMetadataPatch,
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
})
