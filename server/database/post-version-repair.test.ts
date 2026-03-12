import { describe, expect, it } from 'vitest'
import { normalizePostVersionChain } from './post-version-repair'
import { PostVisibility } from '@/types/post'
import { PostVersionSource } from '@/types/post-version'

describe('post-version-repair', () => {
    it('should normalize legacy versions into a linear sequence chain', () => {
        const versions = normalizePostVersionChain([
            {
                id: 'version-2',
                postId: 'post-1',
                title: 'Edited title',
                content: 'Edited content',
                summary: 'Edited summary',
                source: PostVersionSource.EDIT,
                createdAt: new Date('2026-03-12T00:05:00.000Z'),
            },
            {
                id: 'version-1',
                postId: 'post-1',
                title: 'Initial title',
                content: 'Initial content',
                summary: 'Initial summary',
                source: PostVersionSource.EDIT,
                createdAt: new Date('2026-03-12T00:00:00.000Z'),
            },
        ] as any, {
            coverImage: '/cover.webp',
            categoryId: 'category-1',
            tags: [{ id: 'tag-1' }],
            visibility: PostVisibility.PUBLIC,
            copyright: 'CC BY-NC-SA',
            metaVersion: 2,
            metadata: { audio: { url: '/audio/test.mp3', duration: 12 } },
            language: 'zh-CN',
            translationId: 'translation-1',
        })

        expect(versions).toHaveLength(2)
        expect(versions[0].id).toBe('version-1')
        expect(versions[0].sequence).toBe(1)
        expect(versions[0].parentVersionId).toBeNull()
        expect(versions[0].snapshot.title).toBe('Initial title')
        expect(versions[0].snapshot.tagIds).toEqual(['tag-1'])
        expect(versions[0].snapshotHash).toBeTruthy()

        expect(versions[1].id).toBe('version-2')
        expect(versions[1].sequence).toBe(2)
        expect(versions[1].parentVersionId).toBe('version-1')
        expect(versions[1].changedFields).toContain('title')
        expect(versions[1].changedFields).toContain('content')
        expect(versions[1].commitSummary).toContain('edit:')
    })
})
