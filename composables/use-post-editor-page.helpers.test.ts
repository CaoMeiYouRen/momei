import { describe, expect, it } from 'vitest'
import { buildComparablePostEditorState } from './use-post-editor-page.helpers'
import { PostStatus, PostVisibility } from '@/types/post'
import type { PostEditorData } from '@/types/post-editor'

function createPost(overrides: Partial<PostEditorData> = {}): PostEditorData {
    return {
        id: 'post-1',
        title: 'Title',
        content: 'Content',
        slug: 'title',
        status: PostStatus.DRAFT,
        visibility: PostVisibility.PUBLIC,
        password: null,
        summary: 'Summary',
        coverImage: 'https://example.com/cover.jpg',
        metadata: {
            publish: {
                intent: {
                    pushOption: 'none',
                },
            },
        },
        categoryId: 'category-1',
        copyright: null,
        tags: ['tag-a', 'tag-b'],
        isPinned: false,
        language: 'zh-CN',
        translationId: 'translation-1',
        publishedAt: null,
        metaVersion: 1,
        views: 42,
        createdAt: '2026-04-09T00:00:00.000Z',
        updatedAt: '2026-04-09T00:00:00.000Z',
        audioUrl: null,
        audioDuration: null,
        audioSize: null,
        audioMimeType: null,
        ...overrides,
    }
}

describe('buildComparablePostEditorState', () => {
    it('keeps editable fields for dirty checks', () => {
        const comparable = buildComparablePostEditorState(createPost())

        expect(comparable).toMatchObject({
            title: 'Title',
            content: 'Content',
            slug: 'title',
            status: PostStatus.DRAFT,
            visibility: PostVisibility.PUBLIC,
            tags: ['tag-a', 'tag-b'],
            language: 'zh-CN',
            translationId: 'translation-1',
        })
    })

    it('excludes non-editable transport fields such as id, views and timestamps', () => {
        const comparable = buildComparablePostEditorState(createPost()) as Record<string, unknown>

        expect(comparable.id).toBeUndefined()
        expect(comparable.views).toBeUndefined()
        expect(comparable.createdAt).toBeUndefined()
        expect(comparable.updatedAt).toBeUndefined()
    })
})
