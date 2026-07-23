import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import {
    buildComparablePostEditorState,
    buildSavePayload,
    getPostStatusLabel,
    getPostStatusSeverity,
    searchTagOptions,
    restorePostFromHistory,
} from './use-post-editor-page.helpers'
import { PostStatus, PostVisibility } from '@/types/post'
import type { PostEditorData } from '@/types/post-editor'

function createMockPost(overrides: Partial<PostEditorData> = {}): PostEditorData {
    return {
        id: 'post-1',
        title: 'Test Post',
        content: '# Hello',
        slug: 'test-post',
        status: PostStatus.DRAFT,
        visibility: PostVisibility.PUBLIC,
        password: null,
        summary: 'A summary',
        coverImage: null,
        metadata: null,
        categoryId: null,
        copyright: null,
        tags: [],
        isPinned: false,
        language: 'zh-CN',
        translationId: null,
        publishedAt: null,
        metaVersion: 0,
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    }
}

describe('use-post-editor-page helpers', () => {
    describe('buildComparablePostEditorState', () => {
        it('extracts comparable fields from a post', () => {
            const post = createMockPost({ title: 'Hello', slug: 'hello-world', tags: ['vue', 'nuxt'] })
            const state = buildComparablePostEditorState(post)

            expect(state.title).toBe('Hello')
            expect(state.slug).toBe('hello-world')
            expect(state.tags).toEqual(['vue', 'nuxt'])
            // should be a copy, not the same ref
            expect(state.tags).not.toBe(post.tags)
        })

        it('handles posts with null tags', () => {
            const post = createMockPost({ tags: undefined as any })
            const state = buildComparablePostEditorState(post)
            expect(state.tags).toEqual([])
        })
    })

    describe('buildSavePayload', () => {
        it('builds publish intent with payload metadata', () => {
            const post = createMockPost({ publishedAt: null })
            const result = buildSavePayload({
                post,
                tagBindings: [{ name: 'vue', translationId: null, sourceTagSlug: null, sourceTagId: null }],
                publish: true,
                pushOption: 'now',
                pushCriteria: { categoryIds: ['cat-1'] },
            })

            expect(result.isFuture).toBe(false)
            expect(result.payload.status).toBe('published')
            expect((result.payload.metadata as any).publish.intent.pushOption).toBe('now')
        })

        it('marks as scheduled when publishedAt is in the future', () => {
            const futureDate = new Date(Date.now() + 86400000).toISOString()
            const post = createMockPost({ publishedAt: futureDate })
            const result = buildSavePayload({
                post,
                tagBindings: [],
                publish: true,
                pushOption: 'none',
            })

            expect(result.isFuture).toBe(true)
            expect(result.payload.status).toBe('scheduled')
        })

        it('does not change status when publish is false', () => {
            const post = createMockPost({ status: PostStatus.DRAFT })
            const result = buildSavePayload({
                post,
                tagBindings: [],
                publish: false,
                pushOption: 'none',
            })

            expect(result.payload.status).toBe(PostStatus.DRAFT)
        })

        it('strips category and author from payload', () => {
            const post = createMockPost()
            const result = buildSavePayload({
                post,
                tagBindings: [],
                publish: false,
                pushOption: 'none',
            })
            expect(result.payload.category).toBeUndefined()
            expect(result.payload.author).toBeUndefined()
        })
    })

    describe('getPostStatusLabel', () => {
        const mockT = vi.fn((key: string) => {
            const map: Record<string, string> = {
                'common.status.published': '已发布',
                'common.status.scheduled': '已排期',
                'common.status.draft': '草稿',
                'common.status.pending': '待审核',
                'common.status.rejected': '已拒绝',
                'common.status.hidden': '已隐藏',
            }
            return map[key] || key
        })

        it('returns translated labels for known statuses', () => {
            expect(getPostStatusLabel(mockT, 'published')).toBe('已发布')
            expect(getPostStatusLabel(mockT, 'draft')).toBe('草稿')
            expect(getPostStatusLabel(mockT, 'scheduled')).toBe('已排期')
            expect(getPostStatusLabel(mockT, 'pending')).toBe('待审核')
            expect(getPostStatusLabel(mockT, 'rejected')).toBe('已拒绝')
            expect(getPostStatusLabel(mockT, 'hidden')).toBe('已隐藏')
        })

        it('falls back to raw status string for unknown statuses', () => {
            expect(getPostStatusLabel(mockT, 'unknown_status')).toBe('unknown_status')
        })
    })

    describe('getPostStatusSeverity', () => {
        it('returns correct severity for each status', () => {
            expect(getPostStatusSeverity('published')).toBe('success')
            expect(getPostStatusSeverity('scheduled')).toBe('info')
            expect(getPostStatusSeverity('draft')).toBe('secondary')
            expect(getPostStatusSeverity('pending')).toBe('warn')
            expect(getPostStatusSeverity('rejected')).toBe('danger')
            expect(getPostStatusSeverity('hidden')).toBe('info')
        })

        it('falls back to info for unknown status', () => {
            expect(getPostStatusSeverity('unknown')).toBe('info')
        })
    })

    describe('searchTagOptions', () => {
        it('returns all tags when query is empty', () => {
            const allTags = ref(['vue', 'nuxt', 'typescript'])
            const filteredTags = ref<string[]>([])
            searchTagOptions(allTags, filteredTags, { query: '' })
            expect(filteredTags.value).toEqual(['vue', 'nuxt', 'typescript'])
        })

        it('filters tags by case-insensitive prefix', () => {
            const allTags = ref(['Vue', 'Nuxt', 'TypeScript'])
            const filteredTags = ref<string[]>([])
            searchTagOptions(allTags, filteredTags, { query: 'vu' })
            expect(filteredTags.value).toEqual(['Vue'])
        })

        it('returns empty array for no match', () => {
            const allTags = ref(['vue', 'nuxt'])
            const filteredTags = ref<string[]>([])
            searchTagOptions(allTags, filteredTags, { query: 'xxxx' })
            expect(filteredTags.value).toEqual([])
        })
    })

    describe('restorePostFromHistory', () => {
        it('restores post fields from history data', () => {
            const post = ref(createMockPost())
            const historyData: Parameters<typeof restorePostFromHistory>[2] = {
                title: 'Restored Title',
                content: '# Restored',
                summary: 'Restored summary',
                coverImage: 'https://example.com/cover.jpg',
                categoryId: 'cat-1',
                visibility: PostVisibility.PUBLIC,
                copyright: 'CC-BY',
                metaVersion: 2,
                metadata: { key: 'value' } as any,
                tags: ['tag1', 'tag2'],
            }

            const clearDraft = vi.fn()
            restorePostFromHistory(post, clearDraft, historyData)

            expect(post.value.title).toBe('Restored Title')
            expect(post.value.content).toBe('# Restored')
            expect(post.value.metaVersion).toBe(2)
            expect(post.value.tags).toEqual(['tag1', 'tag2'])
            expect(clearDraft).toHaveBeenCalled()
        })
    })
})
