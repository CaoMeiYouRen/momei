import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    buildComparablePostEditorState,
    buildSavePayload,
    getPostStatusLabel,
    getPostStatusSeverity,
    handlePreviewOpen,
    loadExistingPostDetail,
    persistPost,
    preloadSourcePost,
    promptDraftRecovery,
    restorePostFromHistory,
    searchTagOptions,
    setTranslationWorkflowState,
} from './use-post-editor-page.helpers'
import { PostStatus, PostVisibility } from '@/types/post'
import type { PostEditorData } from '@/types/post-editor'

const fetchMock = vi.fn()
const navigateToMock = vi.fn()

vi.stubGlobal('$fetch', fetchMock)
vi.stubGlobal('navigateTo', navigateToMock)

beforeEach(() => {
    fetchMock.mockReset()
    navigateToMock.mockReset()
})

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

function createLoadOptions(overrides: Record<string, unknown> = {}) {
    return {
        route: { query: {}, params: {} } as never,
        post: ref(createPost()),
        sourcePostSnapshot: ref(null),
        translationWorkflowDefaults: ref({ sourcePostId: null, targetLanguage: '', scopes: [] }),
        translationDialogVisible: ref(false),
        loadCategories: vi.fn().mockResolvedValue(undefined),
        loadTags: vi.fn().mockResolvedValue(undefined),
        fetchTranslations: vi.fn().mockResolvedValue(undefined),
        parseTranslationScopes: vi.fn((value: string | string[] | undefined) => typeof value === 'string' ? value.split(',') : value || []),
        resolveTranslatedTagBindings: vi.fn().mockResolvedValue([]),
        resolveMatchedCategoryId: vi.fn().mockReturnValue('matched-category'),
        applyTagBindings: vi.fn(),
        hasRecoverableDraft: vi.fn().mockReturnValue(false),
        recoverDraft: vi.fn(),
        clearLocalDraft: vi.fn(),
        confirm: { require: vi.fn() },
        t: vi.fn((key: string) => key),
        showSuccessToast: vi.fn(),
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

    it('copies tags into a new array', () => {
        const post = createPost({ tags: ['a', 'b'] })
        const state = buildComparablePostEditorState(post)

        expect(state.tags).toEqual(['a', 'b'])
        expect(state.tags).not.toBe(post.tags)
    })

    it('handles undefined tags gracefully', () => {
        const post = createPost({ tags: undefined as unknown as string[] })
        const state = buildComparablePostEditorState(post)

        expect(state.tags).toEqual([])
    })
})

describe('setTranslationWorkflowState', () => {
    it('does nothing when autoTranslate is not "true"', () => {
        const post = ref(createPost({ language: 'en-US' }))
        const translationWorkflowDefaults = ref({ sourcePostId: null, targetLanguage: '', scopes: [] })
        const translationDialogVisible = ref(false)
        const parseTranslationScopes = vi.fn().mockReturnValue([])

        setTranslationWorkflowState({
            route: { query: { autoTranslate: 'false' } } as never,
            post,
            sourcePostSnapshot: ref(null),
            translationWorkflowDefaults,
            translationDialogVisible,
            parseTranslationScopes,
        })

        expect(translationDialogVisible.value).toBe(false)
        expect(parseTranslationScopes).not.toHaveBeenCalled()
    })

    it('sets defaults and opens dialog when autoTranslate is "true"', () => {
        const post = ref(createPost({ language: 'en-US' }))
        const translationWorkflowDefaults = ref({ sourcePostId: null, targetLanguage: '', scopes: [] })
        const translationDialogVisible = ref(false)
        const parseTranslationScopes = vi.fn().mockReturnValue(['title', 'content'])

        setTranslationWorkflowState({
            route: {
                query: { autoTranslate: 'true', sourceId: 'src-123', translationScopes: 'title,content' },
            } as never,
            post,
            sourcePostSnapshot: ref(null),
            translationWorkflowDefaults,
            translationDialogVisible,
            parseTranslationScopes,
        })

        expect(translationDialogVisible.value).toBe(true)
        expect(translationWorkflowDefaults.value.sourcePostId).toBe('src-123')
        expect(translationWorkflowDefaults.value.targetLanguage).toBe('en-US')
        expect(translationWorkflowDefaults.value.scopes).toEqual(['title', 'content'])
    })

    it('falls back to snapshot id when sourceId query is absent', () => {
        const post = ref(createPost({ language: 'zh-CN' }))
        const translationWorkflowDefaults = ref({ sourcePostId: null, targetLanguage: '', scopes: [] })
        const translationDialogVisible = ref(false)
        const parseTranslationScopes = vi.fn().mockReturnValue([])

        setTranslationWorkflowState({
            route: { query: { autoTranslate: 'true' } } as never,
            post,
            sourcePostSnapshot: ref({ id: 'snap-456' } as never),
            translationWorkflowDefaults,
            translationDialogVisible,
            parseTranslationScopes,
        })

        expect(translationWorkflowDefaults.value.sourcePostId).toBe('snap-456')
    })

    it('sourcePostId is null when neither sourceId nor snapshot is available', () => {
        const post = ref(createPost({ language: 'zh-CN' }))
        const translationWorkflowDefaults = ref({ sourcePostId: null, targetLanguage: '', scopes: [] })
        const translationDialogVisible = ref(false)
        const parseTranslationScopes = vi.fn().mockReturnValue([])

        setTranslationWorkflowState({
            route: { query: { autoTranslate: 'true' } } as never,
            post,
            sourcePostSnapshot: ref(null),
            translationWorkflowDefaults,
            translationDialogVisible,
            parseTranslationScopes,
        })

        expect(translationWorkflowDefaults.value.sourcePostId).toBeNull()
    })
})

describe('promptDraftRecovery', () => {
    it('does nothing when there is no recoverable draft', () => {
        const confirm = { require: vi.fn() }
        const t = vi.fn()

        promptDraftRecovery({
            hasRecoverableDraft: () => false,
            confirm,
            t,
            recoverDraft: vi.fn(),
            clearLocalDraft: vi.fn(),
            showSuccessToast: vi.fn(),
        })

        expect(confirm.require).not.toHaveBeenCalled()
    })

    it('calls confirm.require when draft is recoverable', () => {
        const confirm = { require: vi.fn() }
        const t = vi.fn((key: string) => key)

        promptDraftRecovery({
            hasRecoverableDraft: () => true,
            confirm,
            t,
            recoverDraft: vi.fn(),
            clearLocalDraft: vi.fn(),
            showSuccessToast: vi.fn(),
        })

        expect(confirm.require).toHaveBeenCalledOnce()
        const opts = vi.mocked(confirm.require).mock.calls[0]?.[0]
        expect(opts).toHaveProperty('accept')
        expect(opts).toHaveProperty('reject')
    })

    it('accept callback recovers draft and shows success toast', () => {
        const confirm = { require: vi.fn() }
        const t = vi.fn((key: string) => key)
        const recoverDraft = vi.fn()
        const showSuccessToast = vi.fn()

        promptDraftRecovery({
            hasRecoverableDraft: () => true,
            confirm,
            t,
            recoverDraft,
            clearLocalDraft: vi.fn(),
            showSuccessToast,
        })

        const opts = vi.mocked(confirm.require).mock.calls[0]?.[0] as Record<string, () => void>
        expect(typeof opts.accept).toBe('function')
        opts.accept?.()

        expect(recoverDraft).toHaveBeenCalledOnce()
        expect(showSuccessToast).toHaveBeenCalledWith('pages.admin.posts.draft_recovered')
    })

    it('reject callback discards draft and shows info toast', () => {
        const confirm = { require: vi.fn() }
        const t = vi.fn((key: string) => key)
        const clearLocalDraft = vi.fn()
        const showSuccessToast = vi.fn()

        promptDraftRecovery({
            hasRecoverableDraft: () => true,
            confirm,
            t,
            recoverDraft: vi.fn(),
            clearLocalDraft,
            showSuccessToast,
        })

        const opts = vi.mocked(confirm.require).mock.calls[0]?.[0] as Record<string, () => void>
        expect(typeof opts.reject).toBe('function')
        opts.reject?.()

        expect(clearLocalDraft).toHaveBeenCalledOnce()
        expect(showSuccessToast).toHaveBeenCalledWith('pages.admin.posts.draft_discarded', {
            severity: 'info',
            summaryKey: 'common.info',
        })
    })
})

describe('preloadSourcePost', () => {
    it('prefills editor fields from source post and loads translation dependencies', async () => {
        const options = createLoadOptions({
            route: {
                query: {
                    sourceId: 'source-1',
                    translationId: 'translation-2',
                    autoTranslate: 'false',
                },
                params: {},
            } as never,
            resolveTranslatedTagBindings: vi.fn().mockResolvedValue([{ name: 'translated-tag' }]),
        })

        fetchMock.mockResolvedValueOnce({
            data: {
                id: 'source-1',
                title: 'Source Title',
                summary: 'Source Summary',
                content: 'Source Content',
                coverImage: 'https://example.com/source-cover.jpg',
                tags: [{ id: 'tag-1', name: 'Tag A', slug: 'tag-a', translationId: 'tag-translation-1' }],
                category: { id: 'category-9', name: 'Source Category', slug: 'source-category', translationId: 'cat-translation-1' },
                language: 'ja-JP',
                slug: 'source-title',
                translationId: 'translation-2',
                copyright: 'CC BY',
            },
        })

        await preloadSourcePost(options as never)

        expect(fetchMock).toHaveBeenCalledWith('/api/posts/source-1')
        expect(options.loadCategories).toHaveBeenCalledWith('zh-CN')
        expect(options.loadTags).toHaveBeenCalledWith('zh-CN')
        expect(options.resolveTranslatedTagBindings).toHaveBeenCalledWith([
            { id: 'tag-1', name: 'Tag A', slug: 'tag-a', translationId: 'tag-translation-1' },
        ], 'ja-JP', 'zh-CN')
        expect(options.applyTagBindings).toHaveBeenCalledWith([{ name: 'translated-tag' }])
        expect(options.fetchTranslations).toHaveBeenCalledWith('translation-2')
        expect(options.post.value.title).toBe('Source Title')
        expect(options.post.value.translationId).toBe('translation-2')
        expect(options.post.value.categoryId).toBe('matched-category')
    })

    it('keeps source snapshot but skips prefill when autoTranslate is enabled', async () => {
        const options = createLoadOptions({
            route: {
                query: {
                    sourceId: 'source-1',
                    autoTranslate: 'true',
                    translationScopes: ['title'],
                },
                params: {},
            } as never,
        })

        fetchMock.mockResolvedValueOnce({
            data: {
                id: 'source-1',
                title: 'Source Title',
                summary: 'Source Summary',
                content: 'Source Content',
                coverImage: 'https://example.com/source-cover.jpg',
                tags: [{ id: 'tag-1', name: 'Tag A', slug: 'tag-a', translationId: 'tag-translation-1' }],
                category: { id: 'category-9', name: 'Source Category', slug: 'source-category', translationId: 'cat-translation-1' },
                language: 'ja-JP',
                slug: 'source-title',
                translationId: 'translation-2',
                copyright: 'CC BY',
            },
        })

        await preloadSourcePost(options as never)

        expect(options.sourcePostSnapshot.value).toMatchObject({ id: 'source-1', title: 'Source Title' })
        expect(options.loadCategories).not.toHaveBeenCalled()
        expect(options.loadTags).not.toHaveBeenCalled()
        expect(options.applyTagBindings).not.toHaveBeenCalled()
        expect(options.post.value.title).toBe('Title')
        expect(options.post.value.slug).toBe('source-title')
        expect(options.post.value.translationId).toBe('translation-2')
        expect(options.translationDialogVisible.value).toBe(true)
        expect(options.translationWorkflowDefaults.value).toMatchObject({
            sourcePostId: 'source-1',
            targetLanguage: 'zh-CN',
            scopes: ['title'],
        })
    })

    it('only fetches translations when source id is absent', async () => {
        const options = createLoadOptions({
            route: {
                query: {
                    translationId: 'translation-3',
                    autoTranslate: 'true',
                    sourceId: 'source-fallback',
                    translationScopes: 'title,content',
                },
                params: {},
            } as never,
        })

        await preloadSourcePost({
            ...options,
            route: {
                query: {
                    translationId: 'translation-3',
                    autoTranslate: 'true',
                    translationScopes: 'title,content',
                },
                params: {},
            } as never,
        } as never)

        expect(options.fetchTranslations).toHaveBeenCalledWith('translation-3')
        expect(options.translationDialogVisible.value).toBe(true)
        expect(options.translationWorkflowDefaults.value).toMatchObject({
            sourcePostId: null,
            targetLanguage: 'zh-CN',
            scopes: ['title', 'content'],
        })
    })

    it('continues with translation workflow when source preload fails', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const options = createLoadOptions({
            route: {
                query: {
                    sourceId: 'source-1',
                    translationId: 'translation-9',
                    autoTranslate: 'true',
                },
                params: {},
            } as never,
        })

        fetchMock.mockRejectedValueOnce(new Error('source fetch failed'))

        await preloadSourcePost(options as never)

        expect(options.fetchTranslations).toHaveBeenCalledWith('translation-9')
        expect(options.translationDialogVisible.value).toBe(true)
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to pre-fill from source post', expect.any(Error))

        consoleErrorSpy.mockRestore()
    })
})

describe('loadExistingPostDetail', () => {
    it('hydrates post detail, tag bindings and translation source snapshot', async () => {
        const options = createLoadOptions({
            route: {
                query: {
                    autoTranslate: 'true',
                    sourceId: 'source-2',
                },
                params: {
                    id: 'post-1',
                },
            } as never,
            hasRecoverableDraft: vi.fn().mockReturnValue(true),
        })

        fetchMock
            .mockResolvedValueOnce({
                data: {
                    id: 'post-1',
                    title: 'Existing Title',
                    summary: 'Existing Summary',
                    content: 'Existing Content',
                    coverImage: 'https://example.com/existing.jpg',
                    status: PostStatus.PUBLISHED,
                    visibility: PostVisibility.PASSWORD,
                    views: 99,
                    category: { id: 'category-2', name: 'Category', slug: 'category', translationId: 'cat-2' },
                    tags: [{ id: 'tag-2', name: 'Tag B', slug: 'tag-b', translationId: 'tag-2-translation' }],
                    language: 'en-US',
                    slug: 'existing-title',
                    translationId: 'translation-existing',
                },
            })
            .mockResolvedValueOnce({
                data: {
                    id: 'source-2',
                    title: 'Source Snapshot',
                },
            })

        await loadExistingPostDetail(options as never)

        expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/posts/post-1')
        expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/posts/source-2')
        expect(options.post.value).toMatchObject({
            id: 'post-1',
            title: 'Existing Title',
            status: PostStatus.PUBLISHED,
            visibility: PostVisibility.PASSWORD,
            views: 99,
            categoryId: 'category-2',
            tags: ['Tag B'],
            language: 'en-US',
            translationId: 'translation-existing',
        })
        expect(options.applyTagBindings).toHaveBeenCalledWith([
            {
                name: 'Tag B',
                translationId: 'tag-2-translation',
                sourceTagSlug: 'tag-b',
                sourceTagId: 'tag-2',
            },
        ])
        expect(options.fetchTranslations).toHaveBeenCalledWith('translation-existing')
        expect(options.sourcePostSnapshot.value).toMatchObject({ id: 'source-2', title: 'Source Snapshot' })
        expect(vi.mocked(options.confirm.require)).toHaveBeenCalledOnce()
        expect(options.translationDialogVisible.value).toBe(true)
    })

    it('still applies translation workflow and draft recovery when detail payload is empty', async () => {
        const options = createLoadOptions({
            route: {
                query: {
                    autoTranslate: 'true',
                    translationScopes: 'summary',
                },
                params: {
                    id: 'post-2',
                },
            } as never,
            hasRecoverableDraft: vi.fn().mockReturnValue(true),
        })

        fetchMock.mockResolvedValueOnce({ data: null })

        await loadExistingPostDetail(options as never)

        expect(options.fetchTranslations).not.toHaveBeenCalled()
        expect(options.applyTagBindings).not.toHaveBeenCalled()
        expect(vi.mocked(options.confirm.require)).not.toHaveBeenCalled()
        expect(options.translationDialogVisible.value).toBe(false)
        expect(options.translationWorkflowDefaults.value).toMatchObject({
            sourcePostId: null,
            targetLanguage: '',
            scopes: [],
        })
    })

    it('keeps editor usable when loading the source snapshot fails', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const options = createLoadOptions({
            route: {
                query: {
                    sourceId: 'source-2',
                },
                params: {
                    id: 'post-1',
                },
            } as never,
        })

        fetchMock
            .mockResolvedValueOnce({
                data: {
                    id: 'post-1',
                    title: 'Existing Title',
                    content: 'Existing Content',
                    slug: 'existing-title',
                    language: 'en-US',
                    tags: [],
                    category: null,
                    translationId: null,
                },
            })
            .mockRejectedValueOnce(new Error('snapshot failed'))

        await loadExistingPostDetail(options as never)

        expect(options.post.value.title).toBe('Existing Title')
        expect(options.sourcePostSnapshot.value).toBeNull()
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load translation source snapshot', expect.any(Error))

        consoleErrorSpy.mockRestore()
    })
})

describe('buildSavePayload', () => {
    it('marks published future posts as scheduled and preserves publish intent', () => {
        const futurePost = createPost({
            publishedAt: '2099-01-01T00:00:00.000Z',
            metadata: {
                publish: {
                    intent: {
                        syncToMemos: true,
                    },
                },
            },
        })

        const result = buildSavePayload({
            post: futurePost,
            tagBindings: [{ name: 'tag-a' }],
            publish: true,
            pushOption: 'now',
            pushCriteria: { categoryIds: ['category-1'] },
        })

        expect(result.isFuture).toBe(true)
        expect(result.payload.status).toBe('scheduled')
        expect(result.payload.tagBindings).toEqual([{ name: 'tag-a' }])
        expect(result.payload.category).toBeUndefined()
        expect(result.publishIntent).toEqual({
            syncToMemos: true,
            pushOption: 'now',
            pushCriteria: { categoryIds: ['category-1'] },
        })
    })

    it('keeps status unchanged when saving without publish intent', () => {
        const result = buildSavePayload({
            post: createPost({
                status: PostStatus.DRAFT,
                metadata: undefined,
            }),
            tagBindings: [],
            publish: false,
            pushOption: 'draft',
        })

        expect(result.isFuture).toBe(false)
        expect(result.payload.status).toBe(PostStatus.DRAFT)
        expect(result.publishIntent).toEqual({
            pushOption: 'draft',
            pushCriteria: undefined,
        })
    })
})

describe('persistPost', () => {
    it('creates new posts, updates local state and redirects', async () => {
        const post = ref(createPost({ id: undefined, status: PostStatus.DRAFT }))
        const clearLocalDraft = vi.fn()
        const showSuccessToast = vi.fn()

        fetchMock.mockResolvedValueOnce({
            code: 200,
            data: {
                id: 'created-post',
                status: PostStatus.PUBLISHED,
            },
        })

        await persistPost({
            post,
            isNew: true,
            route: { params: {} } as never,
            localePath: (path: string) => `/zh-CN${path}`,
            clearLocalDraft,
            showSuccessToast,
        }, true, { title: 'payload' }, false)

        expect(fetchMock).toHaveBeenCalledWith('/api/posts', {
            method: 'POST',
            body: { title: 'payload' },
        })
        expect(post.value.id).toBe('created-post')
        expect(post.value.status).toBe(PostStatus.PUBLISHED)
        expect(clearLocalDraft).toHaveBeenCalledOnce()
        expect(showSuccessToast).toHaveBeenCalledWith('common.save_success')
    })

    it('updates existing posts and sets published status immediately when needed', async () => {
        const post = ref(createPost({ status: PostStatus.DRAFT }))
        const clearLocalDraft = vi.fn()
        const showSuccessToast = vi.fn()

        fetchMock.mockResolvedValueOnce({ code: 200 })

        await persistPost({
            post,
            isNew: false,
            route: { params: { id: 'post-1' } } as never,
            localePath: (path: string) => path,
            clearLocalDraft,
            showSuccessToast,
        }, true, { title: 'updated' }, false)

        expect(fetchMock).toHaveBeenCalledWith('/api/posts/post-1', {
            method: 'PUT',
            body: { title: 'updated' },
        })
        expect(post.value.status).toBe(PostStatus.PUBLISHED)
        expect(clearLocalDraft).toHaveBeenCalledOnce()
        expect(showSuccessToast).toHaveBeenCalledWith('common.save_success')
    })

    it('leaves draft state unchanged when an update is saved without publishing', async () => {
        const post = ref(createPost({ status: PostStatus.DRAFT }))

        await persistPost({
            post,
            isNew: false,
            route: { params: { id: 'post-1' } } as never,
            localePath: (path: string) => path,
            clearLocalDraft: vi.fn(),
            showSuccessToast: vi.fn(),
        }, false, { title: 'updated' }, true)

        expect(post.value.status).toBe(PostStatus.DRAFT)
    })

    it('does not clear draft or redirect when create response has no id', async () => {
        const post = ref(createPost({ id: undefined, status: PostStatus.DRAFT }))
        const clearLocalDraft = vi.fn()
        const showSuccessToast = vi.fn()

        fetchMock.mockResolvedValueOnce({
            code: 200,
            data: {},
        })

        await persistPost({
            post,
            isNew: true,
            route: { params: {} } as never,
            localePath: (path: string) => path,
            clearLocalDraft,
            showSuccessToast,
        }, false, { title: 'payload' }, false)

        expect(post.value.id).toBeUndefined()
        expect(clearLocalDraft).not.toHaveBeenCalled()
        expect(showSuccessToast).not.toHaveBeenCalled()
        expect(navigateToMock).not.toHaveBeenCalled()
    })
})

describe('editor state helpers', () => {
    it('restores post history data and clears local draft', () => {
        const post = ref(createPost())
        const clearLocalDraft = vi.fn()

        restorePostFromHistory(post, clearLocalDraft, {
            title: 'History Title',
            content: 'History Content',
            summary: 'History Summary',
            coverImage: 'https://example.com/history.jpg',
            categoryId: 'history-category',
            visibility: PostVisibility.PASSWORD,
            copyright: 'History Copyright',
            metaVersion: 9,
            metadata: { source: 'history' } as never,
            tags: ['history-tag'],
        })

        expect(post.value).toMatchObject({
            title: 'History Title',
            content: 'History Content',
            summary: 'History Summary',
            categoryId: 'history-category',
            visibility: PostVisibility.PASSWORD,
            metaVersion: 9,
            tags: ['history-tag'],
        })
        expect(clearLocalDraft).toHaveBeenCalledOnce()
    })

    it('filters tag suggestions and keeps the full list for blank queries', () => {
        const allTags = ref(['Vue', 'Vitest', 'TypeScript'])
        const filteredTags = ref<string[]>([])

        searchTagOptions(allTags, filteredTags, { query: 'vi' })
        expect(filteredTags.value).toEqual(['Vitest'])

        searchTagOptions(allTags, filteredTags, { query: '   ' })
        expect(filteredTags.value).toEqual(['Vue', 'Vitest', 'TypeScript'])
    })

    it('maps status labels and severities with sensible fallbacks', () => {
        const t = vi.fn((key: string) => `translated:${key}`)

        expect(getPostStatusLabel(t, 'published')).toBe('translated:common.status.published')
        expect(getPostStatusLabel(t, 'unknown')).toBe('unknown')
        expect(getPostStatusSeverity('draft')).toBe('secondary')
        expect(getPostStatusSeverity('unknown')).toBe('info')
    })

    it('opens preview only when the post is addressable', () => {
        const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
        const newPost = ref(createPost({ id: undefined, slug: '' }))
        const existingPost = ref(createPost({ id: 'post-8', slug: 'preview-me' }))

        handlePreviewOpen(true, newPost, (path: string) => `/en-US${path}`)
        handlePreviewOpen(false, existingPost, (path: string) => `/en-US${path}`)

        expect(windowOpenSpy).toHaveBeenCalledTimes(1)
        expect(windowOpenSpy).toHaveBeenCalledWith('/en-US/posts/preview-me', '_blank')

        windowOpenSpy.mockRestore()
    })
})
