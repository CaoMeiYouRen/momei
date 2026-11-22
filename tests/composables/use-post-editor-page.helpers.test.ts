/**
 * 编辑器页编排辅助的 Nuxt runtime 分层用例。
 *
 * 纯函数契约（可比较快照 / 保存载荷 / 状态映射 / 历史回填 / 草稿提示）由同源
 * `composables/use-post-editor-page.helpers.test.ts` 承担；本文件只覆盖依赖
 * `$fetch` / `navigateTo` 的编排路径（源文章预填、详情回填、保存与预览），
 * 因此必须留在 `tests/` 下使用 `mockNuxtImport`。
 */
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { PostStatus, PostVisibility } from '@/types/post'
import type { PostEditorData } from '@/types/post-editor'
import {
    handlePreviewOpen,
    loadExistingPostDetail,
    persistPost,
    preloadSourcePost,
} from '@/composables/use-post-editor-page.helpers'

const { fetchMock, navigateToMock } = vi.hoisted(() => ({
    fetchMock: vi.fn(),
    navigateToMock: vi.fn(),
}))

vi.stubGlobal('$fetch', fetchMock)
vi.stubGlobal('navigateTo', navigateToMock)
mockNuxtImport('$fetch', () => fetchMock)
mockNuxtImport('navigateTo', () => navigateToMock)

function createEditorData(overrides: Partial<PostEditorData> = {}): PostEditorData {
    return {
        title: '标题',
        content: '正文',
        slug: 'demo',
        status: PostStatus.DRAFT,
        visibility: PostVisibility.PUBLIC,
        views: 0,
        language: 'zh-CN',
        tags: [],
        ...overrides,
    }
}

function createRoute(query: Record<string, unknown> = {}): RouteLocationNormalizedLoaded {
    return {
        params: { id: 'post-1' },
        query,
        fullPath: '/admin/posts/post-1',
        hash: '',
        name: 'admin-posts-id',
        path: '/admin/posts/post-1',
        matched: [],
        meta: {},
        redirectedFrom: undefined,
    } as unknown as RouteLocationNormalizedLoaded
}

describe('use-post-editor-page.helpers - persistPost', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('新建文章成功后回填 id 并跳转详情页', async () => {
        const post = ref(createEditorData())
        const clearLocalDraft = vi.fn()
        const showSuccessToast = vi.fn()
        fetchMock.mockResolvedValueOnce({ code: 200, data: { id: 'new-post', status: PostStatus.PUBLISHED } })

        await persistPost({
            clearLocalDraft,
            isNew: true,
            localePath: (path) => `/zh${path}`,
            post,
            route: createRoute(),
            showSuccessToast,
        }, false, { title: '标题' }, false)

        expect(post.value.id).toBe('new-post')
        expect(post.value.status).toBe(PostStatus.PUBLISHED)
        expect(clearLocalDraft).toHaveBeenCalledTimes(1)
        expect(showSuccessToast).toHaveBeenCalledWith('common.save_success')
        expect(navigateToMock).toHaveBeenCalledWith('/zh/admin/posts/new-post', { replace: true })
    })

    it('新建文章返回异常码时不跳转', async () => {
        const post = ref(createEditorData())
        const clearLocalDraft = vi.fn()
        const showSuccessToast = vi.fn()
        fetchMock.mockResolvedValueOnce({ code: 500, data: {} })

        await persistPost({
            clearLocalDraft,
            isNew: true,
            localePath: (path) => path,
            post,
            route: createRoute(),
            showSuccessToast,
        }, false, {}, false)

        expect(clearLocalDraft).not.toHaveBeenCalled()
        expect(showSuccessToast).not.toHaveBeenCalled()
        expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('更新文章时按发布状态写回并按定时处理', async () => {
        const post = ref(createEditorData({ id: 'post-1' }))
        const clearLocalDraft = vi.fn()
        const showSuccessToast = vi.fn()
        fetchMock.mockResolvedValueOnce({ code: 200, data: {} })

        await persistPost({
            clearLocalDraft,
            isNew: false,
            localePath: (path) => path,
            post,
            route: createRoute(),
            showSuccessToast,
        }, true, { title: '标题' }, true)

        expect(fetchMock).toHaveBeenCalledWith('/api/posts/post-1', expect.objectContaining({ method: 'PUT' }))
        expect(post.value.status).toBe(PostStatus.SCHEDULED)
        expect(clearLocalDraft).toHaveBeenCalledTimes(1)
        expect(showSuccessToast).toHaveBeenCalledWith('common.save_success')
        expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('更新文章且立即发布时状态为已发布', async () => {
        const post = ref(createEditorData({ id: 'post-1' }))
        fetchMock.mockResolvedValueOnce({ code: 200, data: {} })

        await persistPost({
            clearLocalDraft: vi.fn(),
            isNew: false,
            localePath: (path) => path,
            post,
            route: createRoute(),
            showSuccessToast: vi.fn(),
        }, true, {}, false)

        expect(post.value.status).toBe(PostStatus.PUBLISHED)
    })
})

describe('use-post-editor-page.helpers - handlePreviewOpen', () => {
    it('新建且未保存时不打开预览', () => {
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

        handlePreviewOpen(true, ref(createEditorData()), (path) => path)

        expect(openSpy).not.toHaveBeenCalled()
        openSpy.mockRestore()
    })

    it('已有文章时按 slug 打开预览', () => {
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

        handlePreviewOpen(false, ref(createEditorData({ id: 'post-1', slug: 'demo' })), (path) => `/zh${path}`)

        expect(openSpy).toHaveBeenCalledWith('/zh/posts/demo', '_blank')
        openSpy.mockRestore()
    })

    it('缺少 slug 时回退到 id', () => {
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

        handlePreviewOpen(true, ref(createEditorData({ id: 'post-1', slug: '' })), (path) => path)

        expect(openSpy).toHaveBeenCalledWith('/posts/post-1', '_blank')
        openSpy.mockRestore()
    })
})


function parseScopes(value: string | string[] | undefined): string[] {
    if (Array.isArray(value)) {
        return value
    }

    return value ? [value] : []
}

function createLoadOptions(overrides: Record<string, unknown> = {}) {
    return {
        applyTagBindings: vi.fn(),
        clearLocalDraft: vi.fn(),
        confirm: { confirm: vi.fn() } as never,
        fetchTranslations: vi.fn().mockResolvedValue(undefined),
        hasRecoverableDraft: () => false,
        loadCategories: vi.fn().mockResolvedValue(undefined),
        loadTags: vi.fn().mockResolvedValue(undefined),
        parseTranslationScopes: parseScopes,
        post: ref(createEditorData()),
        recoverDraft: vi.fn(),
        resolveMatchedCategoryId: vi.fn().mockReturnValue('cat-1'),
        resolveTranslatedTagBindings: vi.fn().mockResolvedValue([{ name: '标签副本' }]),
        route: createRoute(),
        showSuccessToast: vi.fn(),
        sourcePostSnapshot: ref(null),
        t: ((key: string) => key) as never,
        translationDialogVisible: ref(false),
        translationWorkflowDefaults: ref({ scopes: [], sourcePostId: null, targetLanguage: 'zh-CN' }),
        ...overrides,
    } as unknown as Parameters<typeof preloadSourcePost>[0]
}

function createSourceDetail(overrides: Record<string, unknown> = {}) {
    return {
        category: { id: 'cat-src', name: '源分类' },
        content: '源正文',
        copyright: 'CC BY',
        coverImage: 'https://example.com/src.png',
        id: 'src-1',
        language: 'en-US',
        slug: 'source-post',
        summary: '源摘要',
        tags: [{ id: 'tag-1', name: 'Source', slug: 'source' }],
        title: '源标题',
        translationId: 'cluster-1',
        ...overrides,
    }
}

describe('use-post-editor-page.helpers - preloadSourcePost', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('无 sourceId 时仅按 translationId 拉取译文', async () => {
        const options = createLoadOptions({ route: createRoute({ translationId: 'tr-1' }) })

        await preloadSourcePost(options)

        expect(options.fetchTranslations).toHaveBeenCalledWith('tr-1')
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('从源文章预填标题、正文与标签绑定', async () => {
        const options = createLoadOptions({ route: createRoute({ sourceId: 'src-1' }) })
        fetchMock.mockResolvedValueOnce({ code: 200, data: createSourceDetail() })

        await preloadSourcePost(options)

        expect(options.loadCategories).toHaveBeenCalledWith('zh-CN')
        expect(options.loadTags).toHaveBeenCalledWith('zh-CN')
        expect(options.post.value.title).toBe('源标题')
        expect(options.post.value.content).toBe('源正文')
        expect(options.applyTagBindings).toHaveBeenCalledWith([{ name: '标签副本' }])
        expect(options.post.value.categoryId).toBe('cat-1')
        expect(options.sourcePostSnapshot.value).toMatchObject({ id: 'src-1' })
    })

    it('autoTranslate 时只记录源快照，不覆盖正文', async () => {
        const options = createLoadOptions({ route: createRoute({ autoTranslate: 'true', sourceId: 'src-1' }) })
        fetchMock.mockResolvedValueOnce({ code: 200, data: createSourceDetail() })

        await preloadSourcePost(options)

        expect(options.post.value.title).toBe('标题')
        expect(options.applyTagBindings).not.toHaveBeenCalled()
        expect(options.translationDialogVisible.value).toBe(true)
        expect(options.translationWorkflowDefaults.value.sourcePostId).toBe('src-1')
    })

    it('源文章接口失败时记录错误并继续流程', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        const options = createLoadOptions({ route: createRoute({ sourceId: 'src-1', translationId: 'tr-1' }) })
        fetchMock.mockRejectedValueOnce(new Error('boom'))

        await preloadSourcePost(options)

        expect(errorSpy).toHaveBeenCalled()
        expect(options.fetchTranslations).toHaveBeenCalledWith('tr-1')
        errorSpy.mockRestore()
    })
})

describe('use-post-editor-page.helpers - loadExistingPostDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('回填详情默认值并按 translationId 拉取译文', async () => {
        const options = createLoadOptions()
        fetchMock.mockResolvedValueOnce({
            code: 200,
            data: createSourceDetail({
                category: { id: 'cat-2', name: '分类' },
                status: undefined,
                tags: [{ id: 'tag-1', name: 'Tag', slug: 'tag' }],
                translationId: 'tr-9',
                visibility: undefined,
                views: undefined,
            }),
        })

        await loadExistingPostDetail(options)

        expect(options.post.value.categoryId).toBe('cat-2')
        expect(options.post.value.status).toBe(PostStatus.DRAFT)
        expect(options.post.value.visibility).toBe(PostVisibility.PUBLIC)
        expect(options.post.value.views).toBe(0)
        expect(options.fetchTranslations).toHaveBeenCalledWith('tr-9')
        expect(options.applyTagBindings).toHaveBeenCalled()
    })

    it('请求的 sourceId 与详情不同时补拉源快照，失败只记录错误', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        const options = createLoadOptions({ route: createRoute({ sourceId: 'src-2' }) })
        fetchMock
            .mockResolvedValueOnce({ code: 200, data: createSourceDetail({ translationId: null }) })
            .mockRejectedValueOnce(new Error('snapshot down'))

        await loadExistingPostDetail(options)

        expect(errorSpy).toHaveBeenCalled()
        expect(options.post.value.translationId).toBe(null)
        errorSpy.mockRestore()
    })

    it('详情无数据或接口失败时只走兜底提示', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        const emptyOptions = createLoadOptions()
        fetchMock.mockResolvedValueOnce({ code: 200, data: undefined })
        await loadExistingPostDetail(emptyOptions)
        expect(emptyOptions.fetchTranslations).not.toHaveBeenCalled()

        const failedOptions = createLoadOptions()
        fetchMock.mockRejectedValueOnce(new Error('detail down'))
        await loadExistingPostDetail(failedOptions)
        expect(errorSpy).toHaveBeenCalledTimes(1)
        errorSpy.mockRestore()
    })
})
