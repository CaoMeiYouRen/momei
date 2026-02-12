import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { usePostEditorAutoSave } from './use-post-editor-auto-save'
import type { PostEditorData } from '@/types/post-editor'
import { PostStatus, PostVisibility } from '@/types/post'

vi.mock('@vueuse/core', () => ({
    useLocalStorage: vi.fn((key: string, defaultValue: unknown) => {
        const storage = ref(defaultValue)
        return storage
    }),
    useDebounceFn: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}))

describe('usePostEditorAutoSave', () => {
    let mockPost: any
    let isNew: any

    beforeEach(() => {
        vi.clearAllMocks()
        mockPost = ref<PostEditorData>({
            title: '',
            content: '',
            summary: '',
            slug: '',
            language: 'zh-CN',
            categoryId: '',
            tags: [],
            coverImage: '',
            status: PostStatus.DRAFT,
            visibility: PostVisibility.PUBLIC,
            views: 0,
        })
        isNew = ref(true)
    })

    describe('draftKey generation', () => {
        it('should generate key for new post', () => {
            const { draftKey } = usePostEditorAutoSave(mockPost, isNew)
            expect(draftKey.value).toBe('momei-draft-zh-CN-new')
        })

        it('should generate key with post id when not new', () => {
            isNew.value = false
            mockPost.value.id = 'post-123'
            const { draftKey } = usePostEditorAutoSave(mockPost, isNew)
            expect(draftKey.value).toBe('momei-draft-zh-CN-post-123')
        })

        it('should use translationId when available', () => {
            mockPost.value.translationId = 'trans-456'
            const { draftKey } = usePostEditorAutoSave(mockPost, isNew)
            expect(draftKey.value).toBe('momei-draft-zh-CN-trans-456')
        })

        it('should update key when language changes', () => {
            const { draftKey } = usePostEditorAutoSave(mockPost, isNew)
            expect(draftKey.value).toBe('momei-draft-zh-CN-new')

            mockPost.value.language = 'en-US'
            expect(draftKey.value).toBe('momei-draft-en-US-new')
        })
    })

    describe('hasRecoverableDraft', () => {
        it('should return false when no local draft exists', () => {
            const { hasRecoverableDraft } = usePostEditorAutoSave(mockPost, isNew)
            expect(hasRecoverableDraft()).toBe(false)
        })

        it('should return true when local draft is newer than server', () => {
            const { hasRecoverableDraft, localDraft } = usePostEditorAutoSave(mockPost, isNew)

            mockPost.value.updatedAt = new Date('2024-01-01T00:00:00Z')
            localDraft.value = {
                title: 'Draft title',
                content: 'Draft content',
                lastSavedAt: new Date('2024-01-01T00:01:00Z').getTime(),
            }

            expect(hasRecoverableDraft()).toBe(true)
        })

        it('should return false when local draft is older than server', () => {
            const { hasRecoverableDraft, localDraft } = usePostEditorAutoSave(mockPost, isNew)

            mockPost.value.updatedAt = new Date('2024-01-01T00:01:00Z')
            localDraft.value = {
                title: 'Draft title',
                content: 'Draft content',
                lastSavedAt: new Date('2024-01-01T00:00:00Z').getTime(),
            }

            expect(hasRecoverableDraft()).toBe(false)
        })

        it('should account for 30 second tolerance', () => {
            const { hasRecoverableDraft, localDraft } = usePostEditorAutoSave(mockPost, isNew)

            const serverTime = new Date('2024-01-01T00:00:00Z').getTime()
            mockPost.value.updatedAt = new Date(serverTime)

            // 29 seconds difference - should be false
            localDraft.value = {
                lastSavedAt: serverTime + 29000,
            }
            expect(hasRecoverableDraft()).toBe(false)

            // 31 seconds difference - should be true
            localDraft.value = {
                lastSavedAt: serverTime + 31000,
            }
            expect(hasRecoverableDraft()).toBe(true)
        })
    })

    describe('recoverDraft', () => {
        it('should restore all draft fields to post', () => {
            const { recoverDraft, localDraft } = usePostEditorAutoSave(mockPost, isNew)

            localDraft.value = {
                title: 'Recovered Title',
                content: 'Recovered Content',
                summary: 'Recovered Summary',
                coverImage: 'https://example.com/image.jpg',
                categoryId: 'cat-1',
                tags: ['tag1', 'tag2'],
            }

            recoverDraft()

            expect(mockPost.value.title).toBe('Recovered Title')
            expect(mockPost.value.content).toBe('Recovered Content')
            expect(mockPost.value.summary).toBe('Recovered Summary')
            expect(mockPost.value.coverImage).toBe('https://example.com/image.jpg')
            expect(mockPost.value.categoryId).toBe('cat-1')
            expect(mockPost.value.tags).toEqual(['tag1', 'tag2'])
        })

        it('should handle partial draft data', () => {
            const { recoverDraft, localDraft } = usePostEditorAutoSave(mockPost, isNew)

            mockPost.value.title = 'Original Title'
            localDraft.value = {
                content: 'Only content recovered',
            }

            recoverDraft()

            expect(mockPost.value.title).toBe('Original Title')
            expect(mockPost.value.content).toBe('Only content recovered')
        })

        it('should do nothing when no draft exists', () => {
            const { recoverDraft } = usePostEditorAutoSave(mockPost, isNew)

            mockPost.value.title = 'Original Title'
            recoverDraft()

            expect(mockPost.value.title).toBe('Original Title')
        })
    })

    describe('clearLocalDraft', () => {
        it('should clear local draft', () => {
            const { clearLocalDraft, localDraft } = usePostEditorAutoSave(mockPost, isNew)

            localDraft.value = {
                title: 'Draft',
                content: 'Content',
            }

            clearLocalDraft()

            expect(localDraft.value).toBeNull()
        })
    })
})
