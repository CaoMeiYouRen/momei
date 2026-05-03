/* eslint-disable max-lines, max-lines-per-function */

import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { hasUnsavedNewDraftContent, usePostEditorTranslation } from './use-post-editor-translation'
import type { PostEditorData } from '@/types/post-editor'
import type {
    PostTagBindingInput,
    PostTranslationCategoryOption,
    PostTranslationProgress,
    PostTranslationSourceDetail,
    PostTranslationSourceOption,
    PostTranslationTagOption,
    PostTranslationWorkflowRequest,
} from '@/types/post-translation'
import { PostStatus, PostVisibility } from '@/types/post'

const { mockFetch, mockNavigateTo } = vi.hoisted(() => ({
    mockFetch: vi.fn(),
    mockNavigateTo: vi.fn(),
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)

beforeEach(() => {
    mockNavigateTo.mockReset()
    mockFetch.mockReset()
    vi.stubGlobal('$fetch', mockFetch)
})

function createPostEditorState(language = 'en-US') {
    return ref<PostEditorData>({
        title: '',
        content: '',
        slug: '',
        status: PostStatus.DRAFT,
        visibility: PostVisibility.PUBLIC,
        password: null,
        summary: '',
        coverImage: '',
        metadata: null,
        categoryId: null,
        copyright: null,
        tags: [],
        language,
        translationId: null,
        views: 0,
    })
}

function createSourcePost(): PostTranslationSourceDetail {
    return {
        id: 'source-post-id',
        title: '源文章',
        content: '源正文',
        summary: '源摘要',
        slug: 'source-post',
        language: 'zh-CN',
        translationId: 'shared-post-cluster',
        status: PostStatus.DRAFT,
        coverImage: 'https://example.com/source-cover.webp',
        metadata: {
            audio: {
                url: 'https://example.com/source-audio.mp3',
                duration: 180,
                size: 2048,
                mimeType: 'audio/mpeg',
            },
        },
        tags: [{
            id: 'source-tag-id',
            name: '源标签',
            slug: 'source-tag',
            translationId: 'shared-tag-cluster',
        }],
    }
}

function createWorkflowRequest(): PostTranslationWorkflowRequest {
    return {
        sourcePostId: 'source-post-id',
        sourceLanguage: 'zh-CN',
        targetLanguage: 'en-US',
        scopes: ['tags'],
        action: 'create',
        targetState: 'missing',
    }
}

function createComposable(options?: {
    language?: string
    categories?: PostTranslationCategoryOption[]
    tagEntities?: PostTranslationTagOption[]
    translateTaxonomyNames?: (names: string[], targetLanguage: string) => Promise<string[]>
    initialTags?: string[]
    initialTagBindings?: PostTagBindingInput[]
    initialTranslations?: PostTranslationSourceOption[]
    isNew?: boolean
    localeItems?: string[]
    postOverrides?: Partial<PostEditorData>
    confirmRequire?: (options: {
        message: string
        header: string
        icon: string
        accept: () => void
        reject: () => void
    }) => void
    loadCategories?: (language?: string) => Promise<void>
    loadTags?: (language?: string) => Promise<void>
    sourcePostSnapshot?: PostTranslationSourceDetail | null
}) {
    const post = createPostEditorState(options?.language)
    Object.assign(post.value, options?.postOverrides)
    post.value.tags = [...(options?.initialTags || [])]
    const tagBindings = ref<PostTagBindingInput[]>([...(options?.initialTagBindings || [])])
    const translateTaxonomyNames = options?.translateTaxonomyNames || vi.fn((names: string[], targetLanguage: string) => Promise.resolve(names.map((name) => `${name}-${targetLanguage}`)))
    const toastAdd = vi.fn()
    const confirmRequire = options?.confirmRequire || vi.fn()
    const loadCategories = options?.loadCategories || vi.fn(() => Promise.resolve())
    const loadTags = options?.loadTags || vi.fn(() => Promise.resolve())
    const resetTranslationProgress = vi.fn()
    const translatePostFields = vi.fn(async (payload: {
        scopes: string[]
        auxiliaryFieldExecutor?: (field: 'tags') => Promise<void>
    }) => {
        if (payload.scopes.includes('tags')) {
            await payload.auxiliaryFieldExecutor?.('tags')
        }

        return true
    })
    const beginAuxiliaryFieldProgress = vi.fn()
    const completeAuxiliaryFieldProgress = vi.fn()
    const failAuxiliaryFieldProgress = vi.fn()
    const translationProgress = ref<PostTranslationProgress>({
        status: 'idle',
        progress: 0,
        activeField: null,
        taskId: null,
        error: null,
        fields: {
            title: {
                status: 'idle',
                progress: 0,
                mode: null,
                content: '',
                completedChunks: 0,
                totalChunks: 0,
                error: null,
                canRetry: false,
                canCancel: false,
            },
            summary: {
                status: 'idle',
                progress: 0,
                mode: null,
                content: '',
                completedChunks: 0,
                totalChunks: 0,
                error: null,
                canRetry: false,
                canCancel: false,
            },
            content: {
                status: 'idle',
                progress: 0,
                mode: null,
                content: '',
                completedChunks: 0,
                totalChunks: 0,
                error: null,
                canRetry: false,
                canCancel: false,
            },
            tags: {
                status: 'idle',
                progress: 0,
                mode: null,
                content: '',
                completedChunks: 0,
                totalChunks: 0,
                error: null,
                canRetry: false,
                canCancel: false,
            },
        },
    })

    const composable = usePostEditorTranslation({
        post,
        isNew: computed(() => options?.isNew ?? true),
        localeItems: computed(() => (options?.localeItems || ['zh-CN', 'en-US']).map((code) => ({ code }))),
        categories: ref(options?.categories || []),
        tagEntities: ref(options?.tagEntities || []),
        toast: {
            add: toastAdd,
        },
        confirm: {
            require: confirmRequire,
        },
        t: (key: string) => key,
        localePath: (path: string) => path,
        loadCategories,
        loadTags,
        getTagBindings: () => tagBindings.value,
        applyTagBindings: (bindings) => {
            tagBindings.value = bindings
            post.value.tags = bindings.map((binding) => binding.name)
        },
        beginAuxiliaryFieldProgress,
        completeAuxiliaryFieldProgress,
        failAuxiliaryFieldProgress,
        translateTaxonomyNames,
        translatePostFields,
        translationProgress,
        resetTranslationProgress,
    })

    composable.sourcePostSnapshot.value = options?.sourcePostSnapshot === undefined
        ? createSourcePost()
        : options.sourcePostSnapshot

    composable.translations.value = [...(options?.initialTranslations || [])]

    return {
        post,
        confirmRequire,
        tagBindings,
        loadCategories,
        loadTags,
        resetTranslationProgress,
        toastAdd,
        translateTaxonomyNames,
        translatePostFields,
        translationProgress,
        beginAuxiliaryFieldProgress,
        completeAuxiliaryFieldProgress,
        failAuxiliaryFieldProgress,
        ...composable,
    }
}

describe('usePostEditorTranslation', () => {
    it('空白新建草稿切换语言时应直接跳转到目标语言新建页', async () => {
        mockNavigateTo.mockReset()

        const { handleTranslationClick, toastAdd } = createComposable({
            language: 'zh-CN',
            sourcePostSnapshot: null,
        })

        await handleTranslationClick('en-US')

        expect(toastAdd).not.toHaveBeenCalled()
        expect(mockNavigateTo).toHaveBeenCalledWith({
            path: '/admin/posts/new',
            query: {
                language: 'en-US',
                sourceId: undefined,
                translationId: undefined,
            },
        })
    })

    it('带来源快照的空白新建草稿切换语言时应保留翻译上下文参数', async () => {
        mockNavigateTo.mockReset()

        const { handleTranslationClick, toastAdd } = createComposable({
            language: 'zh-CN',
            sourcePostSnapshot: createSourcePost(),
        })

        await handleTranslationClick('en-US')

        expect(toastAdd).not.toHaveBeenCalled()
        expect(mockNavigateTo).toHaveBeenCalledWith({
            path: '/admin/posts/new',
            query: {
                language: 'en-US',
                sourceId: 'source-post-id',
                translationId: 'shared-post-cluster',
            },
        })
    })

    it('已录入内容的新建草稿切换语言时仍应提示先保存', async () => {
        mockNavigateTo.mockReset()

        const { handleTranslationClick, post, toastAdd } = createComposable({
            language: 'zh-CN',
        })

        post.value.title = '未保存标题'

        await handleTranslationClick('en-US')

        expect(mockNavigateTo).not.toHaveBeenCalled()
        expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            detail: 'pages.admin.posts.save_current_first',
        }))
    })

    it('仅修改默认值字段时不应将新建草稿视为非空', () => {
        const draft = createPostEditorState('zh-CN')

        expect(hasUnsavedNewDraftContent(draft.value)).toBe(false)

        draft.value.visibility = PostVisibility.PRIVATE
        expect(hasUnsavedNewDraftContent(draft.value)).toBe(true)
    })

    it('metadata 中仅包含空数组、false 和 NaN 时不应视为未保存内容', () => {
        const draft = createPostEditorState('zh-CN')

        draft.value.metadata = {
            nested: ['   ', null],
            disabled: false,
            count: Number.NaN,
        } as never

        expect(hasUnsavedNewDraftContent(draft.value)).toBe(false)
    })

    it('应该在目标语言已有同簇标签时复用现有标签', async () => {
        const { handleStartTranslationWorkflow, post, tagBindings, translateTaxonomyNames } = createComposable({
            tagEntities: [{
                id: 'target-tag-id',
                name: 'Existing Target Tag',
                slug: 'existing-target-tag',
                translationId: 'shared-tag-cluster',
            }],
        })

        await handleStartTranslationWorkflow(createWorkflowRequest())

        expect(post.value.tags).toEqual(['Existing Target Tag'])
        expect(tagBindings.value).toEqual([{
            name: 'Existing Target Tag',
            translationId: 'shared-tag-cluster',
            sourceTagSlug: 'source-tag',
            sourceTagId: 'source-tag-id',
        }])
        expect(translateTaxonomyNames).not.toHaveBeenCalled()
    })

    it('应该在目标语言缺少同簇标签时生成带翻译簇的标签绑定', async () => {
        const translateTaxonomyNames = vi.fn(() => Promise.resolve(['Generated Target Tag']))
        const { handleStartTranslationWorkflow, post, tagBindings } = createComposable({
            translateTaxonomyNames,
        })

        await handleStartTranslationWorkflow(createWorkflowRequest())

        expect(post.value.tags).toEqual(['Generated Target Tag'])
        expect(tagBindings.value).toEqual([{
            name: 'Generated Target Tag',
            translationId: 'shared-tag-cluster',
            sourceTagSlug: 'source-tag',
            sourceTagId: 'source-tag-id',
        }])
        expect(translateTaxonomyNames).toHaveBeenCalledWith(['源标签'], 'en-US')
    })

    it('未选择 tags 范围时应该保留目标文章原有标签', async () => {
        const translateTaxonomyNames = vi.fn(() => Promise.resolve(['Generated Target Tag']))
        const { handleStartTranslationWorkflow, post, tagBindings } = createComposable({
            translateTaxonomyNames,
            initialTags: ['Existing Draft Tag'],
            initialTagBindings: [{
                name: 'Existing Draft Tag',
                translationId: 'existing-draft-cluster',
                sourceTagSlug: 'existing-draft-tag',
                sourceTagId: 'existing-draft-tag-id',
            }],
        })

        await handleStartTranslationWorkflow({
            ...createWorkflowRequest(),
            scopes: ['title'],
        })

        expect(post.value.tags).toEqual(['Existing Draft Tag'])
        expect(tagBindings.value).toEqual([{
            name: 'Existing Draft Tag',
            translationId: 'existing-draft-cluster',
            sourceTagSlug: 'existing-draft-tag',
            sourceTagId: 'existing-draft-tag-id',
        }])
        expect(translateTaxonomyNames).not.toHaveBeenCalled()
    })

    it('选择 tags 范围时应该替换目标文章原有标签', async () => {
        const translateTaxonomyNames = vi.fn(() => Promise.resolve(['Generated Target Tag']))
        const {
            handleStartTranslationWorkflow,
            post,
            tagBindings,
            beginAuxiliaryFieldProgress,
            completeAuxiliaryFieldProgress,
        } = createComposable({
            translateTaxonomyNames,
            initialTags: ['Existing Draft Tag'],
            initialTagBindings: [{
                name: 'Existing Draft Tag',
                translationId: 'existing-draft-cluster',
                sourceTagSlug: 'existing-draft-tag',
                sourceTagId: 'existing-draft-tag-id',
            }],
        })

        await handleStartTranslationWorkflow(createWorkflowRequest())

        expect(post.value.tags).toEqual(['Generated Target Tag'])
        expect(tagBindings.value).toEqual([{
            name: 'Generated Target Tag',
            translationId: 'shared-tag-cluster',
            sourceTagSlug: 'source-tag',
            sourceTagId: 'source-tag-id',
        }])
        expect(beginAuxiliaryFieldProgress).toHaveBeenCalledWith('tags', {
            content: 'Existing Draft Tag',
            totalChunks: 1,
        })
        expect(completeAuxiliaryFieldProgress).toHaveBeenCalledWith('tags', {
            content: 'Generated Target Tag',
            totalChunks: 1,
            completedChunks: 1,
        })
    })

    it('翻译取消时应保留 translationId 且维持工作流弹窗打开', async () => {
        const {
            handleStartTranslationWorkflow,
            post,
            translatePostFields,
            translationDialogVisible,
            translationProgress,
        } = createComposable()

        translationDialogVisible.value = true
        translatePostFields.mockImplementationOnce(() => {
            translationProgress.value.status = 'cancelled'
            return Promise.resolve(false)
        })

        await handleStartTranslationWorkflow(createWorkflowRequest())

        expect(post.value.translationId).toBe('shared-post-cluster')
        expect(translationDialogVisible.value).toBe(true)
    })

    it('选择封面和播客音频范围时应该同步来源附件', async () => {
        const { handleStartTranslationWorkflow, post } = createComposable()

        post.value.coverImage = 'https://example.com/old-cover.webp'
        post.value.metadata = {
            audio: {
                url: 'https://example.com/old-audio.mp3',
                duration: 90,
                size: 1024,
                mimeType: 'audio/ogg',
            },
        }

        await handleStartTranslationWorkflow({
            ...createWorkflowRequest(),
            scopes: ['coverImage', 'audio'],
        })

        expect(post.value.coverImage).toBe('https://example.com/source-cover.webp')
        expect(post.value.metadata?.audio).toEqual({
            url: 'https://example.com/source-audio.mp3',
            duration: 180,
            size: 2048,
            mimeType: 'audio/mpeg',
        })
        expect(Reflect.get(post.value, 'audioUrl')).toBe('https://example.com/source-audio.mp3')
        expect(Reflect.get(post.value, 'audioDuration')).toBe(180)
        expect(Reflect.get(post.value, 'audioSize')).toBe(2048)
        expect(Reflect.get(post.value, 'audioMimeType')).toBe('audio/mpeg')
    })

    it('应该保留 coverImage 和 audio 的范围序列化结果', () => {
        const { serializeTranslationScopes } = createComposable()

        expect(serializeTranslationScopes(['title', 'coverImage', 'audio'])).toBe('title,coverImage,audio')
    })

    it('parseTranslationScopes 应支持数组输入并在无有效值时回退默认范围', () => {
        const { parseTranslationScopes } = createComposable()

        expect(parseTranslationScopes([' audio, title , audio '])).toEqual(['audio', 'title'])
        expect(parseTranslationScopes(['invalid'])).toEqual(['title', 'content', 'summary', 'category', 'tags', 'coverImage'])
    })

    it('未传入范围时应该默认勾选封面但不默认勾选音频', () => {
        const { parseTranslationScopes } = createComposable()

        expect(parseTranslationScopes(undefined)).toEqual(['title', 'content', 'summary', 'category', 'tags', 'coverImage'])
    })

    it('来源语言和目标语言一致时应该提醒并拒绝翻译', async () => {
        const { handleStartTranslationWorkflow, post, toastAdd, translatePostFields } = createComposable({
            language: 'zh-CN',
        })

        post.value.title = '原有标题'

        await handleStartTranslationWorkflow({
            ...createWorkflowRequest(),
            targetLanguage: 'zh-CN',
        })

        expect(translatePostFields).not.toHaveBeenCalled()
        expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            detail: 'pages.admin.posts.translation_workflow.same_language_warning',
        }))
        expect(post.value.title).toBe('原有标题')
    })

    it('选择 audio 范围但来源无音频时应清空 metadata.audio 与 legacy 音频字段', async () => {
        const sourceWithoutAudio = {
            ...createSourcePost(),
            metadata: null,
        }

        const { handleStartTranslationWorkflow, post } = createComposable({
            sourcePostSnapshot: sourceWithoutAudio,
        })

        post.value.metadata = {
            audio: {
                url: 'https://example.com/existing-audio.mp3',
                duration: 99,
                size: 4096,
                mimeType: 'audio/ogg',
            },
        }
        Reflect.set(post.value, 'audioUrl', 'https://example.com/existing-audio.mp3')
        Reflect.set(post.value, 'audioDuration', 99)
        Reflect.set(post.value, 'audioSize', 4096)
        Reflect.set(post.value, 'audioMimeType', 'audio/ogg')

        await handleStartTranslationWorkflow({
            ...createWorkflowRequest(),
            scopes: ['audio'],
        })

        expect(post.value.metadata).toBeNull()
        expect(Reflect.get(post.value, 'audioUrl')).toBeNull()
        expect(Reflect.get(post.value, 'audioDuration')).toBeNull()
        expect(Reflect.get(post.value, 'audioSize')).toBeNull()
        expect(Reflect.get(post.value, 'audioMimeType')).toBeNull()
    })

    it('serializeTranslationScopes 应过滤无效项、去重并在为空时返回 undefined', () => {
        const { serializeTranslationScopes } = createComposable()

        expect(serializeTranslationScopes(['title', 'title', 'audio'])).toBe('title,audio')
        expect(serializeTranslationScopes(['invalid' as never])).toBeUndefined()
        expect(serializeTranslationScopes([])).toBeUndefined()
    })

    it('目标语言已有翻译时应跳转到现有文章并附带自动翻译查询', async () => {
        mockNavigateTo.mockReset()

        const { handleTranslationClick, translations, post } = createComposable({
            language: 'zh-CN',
        })

        post.value.id = 'current-post-id'
        post.value.translationId = 'shared-post-cluster'
        translations.value = [{
            id: 'existing-translation-id',
            title: '已有英文译文',
            language: 'en-US',
            translationId: 'shared-post-cluster',
            status: PostStatus.DRAFT,
        }]

        await handleTranslationClick('en-US', true, {
            sourceId: 'source-post-id',
            scopes: ['title', 'audio'],
        })

        expect(mockNavigateTo).toHaveBeenCalledWith({
            path: '/admin/posts/existing-translation-id',
            query: {
                autoTranslate: 'true',
                sourceId: 'source-post-id',
                translationScopes: 'title,audio',
            },
        })
    })

    it('标签翻译数量不匹配时应写入失败进度并弹出错误提示', async () => {
        const translateTaxonomyNames = vi.fn(() => Promise.resolve([]))
        const {
            handleStartTranslationWorkflow,
            failAuxiliaryFieldProgress,
            toastAdd,
            post,
        } = createComposable({
            translateTaxonomyNames,
            initialTags: ['旧标签'],
        })

        await handleStartTranslationWorkflow(createWorkflowRequest())

        expect(translateTaxonomyNames).toHaveBeenCalledWith(['源标签'], 'en-US')
        expect(failAuxiliaryFieldProgress).toHaveBeenCalledWith('tags', expect.objectContaining({
            error: 'Invalid translated tag names count',
            totalChunks: 1,
            completedChunks: 0,
        }))
        expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.ai_error',
        }))
        expect(post.value.tags).toEqual(['旧标签'])
    })

    it('searchPosts 空查询时不应发起请求', async () => {
        const { searchPosts, postsForTranslation } = createComposable()

        await searchPosts({ query: '   ' })

        expect(mockFetch).not.toHaveBeenCalled()
        expect(postsForTranslation.value).toEqual([])
    })

    it('searchPosts 成功时应过滤当前文章并映射选项', async () => {
        mockFetch.mockResolvedValue({
            data: {
                items: [
                    {
                        id: 'current-post-id',
                        title: '当前文章',
                        language: 'zh-CN',
                        translationId: 'cluster-a',
                    },
                    {
                        id: 'target-post-id',
                        title: '目标文章',
                        language: 'en-US',
                        translationId: 'cluster-b',
                    },
                    {
                        id: 'fallback-post-id',
                        title: '后备文章',
                        language: 'ja-JP',
                        translationId: null,
                    },
                ],
            },
        })

        const { searchPosts, postsForTranslation, post } = createComposable()
        post.value.id = 'current-post-id'

        await searchPosts({ query: '翻译' })

        expect(mockFetch).toHaveBeenCalledWith('/api/posts', {
            query: {
                search: '翻译',
                limit: 10,
                scope: 'manage',
            },
        })
        expect(postsForTranslation.value).toEqual([
            { label: '[en-US] 目标文章', value: 'cluster-b' },
            { label: '[ja-JP] 后备文章', value: 'fallback-post-id' },
        ])
    })

    it('searchPosts 失败时应吞掉错误并保留原列表', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        mockFetch.mockRejectedValue(new Error('search failed'))

        const { searchPosts, postsForTranslation } = createComposable()
        postsForTranslation.value = [{ label: '已有项', value: 'existing' }]

        await searchPosts({ query: '翻译' })

        expect(errorSpy).toHaveBeenCalledWith('Failed to search posts', expect.any(Error))
        expect(postsForTranslation.value).toEqual([{ label: '已有项', value: 'existing' }])

        errorSpy.mockRestore()
    })

    it('fetchTranslations 空 translationId 时应清空列表', async () => {
        const { fetchTranslations, translations } = createComposable({
            initialTranslations: [{
                id: 'existing-id',
                title: '现有译文',
                language: 'en-US',
                translationId: 'cluster-a',
                status: PostStatus.DRAFT,
            }],
        })

        await fetchTranslations('   ')

        expect(mockFetch).not.toHaveBeenCalled()
        expect(translations.value).toEqual([])
    })

    it('fetchTranslations 成功时应过滤当前文章，失败时应记录错误', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        mockFetch.mockResolvedValueOnce({
            data: {
                items: [
                    {
                        id: 'current-post-id',
                        title: '当前文章',
                        language: 'zh-CN',
                        translationId: 'cluster-a',
                        status: PostStatus.DRAFT,
                    },
                    {
                        id: 'existing-translation-id',
                        title: '已有译文',
                        language: 'en-US',
                        translationId: 'cluster-a',
                        status: PostStatus.PUBLISHED,
                    },
                ],
            },
        })
        mockFetch.mockRejectedValueOnce(new Error('fetch translations failed'))

        const { fetchTranslations, translations, post } = createComposable()
        post.value.id = 'current-post-id'

        await fetchTranslations('cluster-a')
        expect(translations.value).toEqual([{
            id: 'existing-translation-id',
            title: '已有译文',
            language: 'en-US',
            translationId: 'cluster-a',
            status: PostStatus.PUBLISHED,
        }])

        await fetchTranslations('cluster-a')
        expect(errorSpy).toHaveBeenCalledWith('Failed to fetch translations', expect.any(Error))

        errorSpy.mockRestore()
    })

    it('translationTargetStatuses 应返回当前编辑态、已发布译文和缺失译文状态', () => {
        const { hasTranslation, translationTargetStatuses, post } = createComposable({
            language: 'zh-CN',
            isNew: false,
            localeItems: ['zh-CN', 'en-US', 'ja-JP'],
            postOverrides: {
                id: 'current-post-id',
                title: '当前文章',
                status: PostStatus.PUBLISHED,
                translationId: 'cluster-a',
            },
            initialTranslations: [{
                id: 'existing-translation-id',
                title: '已有英文译文',
                language: 'en-US',
                translationId: 'cluster-a',
                status: PostStatus.DRAFT,
            }],
        })

        expect(hasTranslation('zh-CN')).toBe(post.value)
        expect(translationTargetStatuses.value).toEqual([
            {
                language: 'zh-CN',
                state: 'published',
                action: 'overwrite',
                postId: 'current-post-id',
                isCurrentEditor: true,
            },
            {
                language: 'en-US',
                state: 'draft',
                action: 'continue',
                postId: 'existing-translation-id',
                isCurrentEditor: false,
            },
            {
                language: 'ja-JP',
                state: 'missing',
                action: 'create',
                postId: null,
                isCurrentEditor: false,
            },
        ])
    })

    it('translationSourceOptions 应合并来源、当前文章与已有译文并跳过无 id 项', () => {
        const { sourcePostSnapshot, translationSourceOptions } = createComposable({
            language: 'zh-CN',
            isNew: false,
            postOverrides: {
                id: 'current-post-id',
                title: '当前文章',
                status: PostStatus.DRAFT,
                translationId: 'cluster-a',
            },
            initialTranslations: [{
                id: 'existing-translation-id',
                title: '已有译文',
                language: 'en-US',
                translationId: 'cluster-a',
                status: PostStatus.PUBLISHED,
            }],
        })

        sourcePostSnapshot.value = {
            ...(createSourcePost()),
            id: '',
        }

        expect(translationSourceOptions.value).toEqual([
            {
                id: 'current-post-id',
                title: '当前文章',
                language: 'zh-CN',
                translationId: 'cluster-a',
                status: PostStatus.DRAFT,
            },
            {
                id: 'existing-translation-id',
                title: '已有译文',
                language: 'en-US',
                translationId: 'cluster-a',
                status: PostStatus.PUBLISHED,
            },
        ])
    })

    it('resolveMatchedCategoryId 应支持空来源和同语言 id 回退匹配', () => {
        const { resolveMatchedCategoryId } = createComposable({
            language: 'zh-CN',
            categories: [{
                id: 'shared-category-id',
                name: '目标分类',
                slug: 'target-category',
                translationId: null,
            }],
        })

        expect(resolveMatchedCategoryId(null, 'zh-CN')).toBeNull()
        expect(resolveMatchedCategoryId({
            id: 'shared-category-id',
            name: '源分类',
            slug: 'source-category',
            translationId: null,
        }, 'zh-CN')).toBe('shared-category-id')
    })

    it('resolveTranslatedTagBindings 应支持空来源、同语言回退和跨语言空名称跳过', async () => {
        const { resolveTranslatedTagBindings, translateTaxonomyNames } = createComposable({
            language: 'zh-CN',
        })

        expect(await resolveTranslatedTagBindings([], 'zh-CN', 'zh-CN')).toEqual([])

        const sameLanguageBindings = await resolveTranslatedTagBindings([
            {
                id: 'shared-tag-id',
                name: '同语言标签',
                slug: 'same-language-tag',
                translationId: null,
            },
            {
                id: 'blank-tag-id',
                name: '   ',
                slug: 'blank-tag',
                translationId: null,
            },
        ], 'zh-CN', 'zh-CN')

        expect(sameLanguageBindings).toEqual([
            {
                name: '同语言标签',
                translationId: 'same-language-tag',
                sourceTagSlug: 'same-language-tag',
                sourceTagId: 'shared-tag-id',
            },
            {
                name: '',
                translationId: 'blank-tag',
                sourceTagSlug: 'blank-tag',
                sourceTagId: 'blank-tag-id',
            },
        ])

        const crossLanguageBindings = await resolveTranslatedTagBindings([
            {
                id: 'blank-tag-id',
                name: '   ',
                slug: 'blank-tag',
                translationId: null,
            },
        ], 'en-US', 'zh-CN')

        expect(crossLanguageBindings).toEqual([])
        expect(translateTaxonomyNames).not.toHaveBeenCalled()
    })

    it('openTranslationWorkflow 在已有文章切换到其他语言时应直接跳转', async () => {
        const { openTranslationWorkflow, resetTranslationProgress, translationDialogVisible } = createComposable({
            language: 'zh-CN',
            isNew: false,
            postOverrides: {
                id: 'current-post-id',
            },
        })

        await openTranslationWorkflow('en-US')

        expect(mockNavigateTo).toHaveBeenCalledWith({
            path: '/admin/posts/new',
            query: {
                language: 'en-US',
                sourceId: 'current-post-id',
                translationId: 'shared-post-cluster',
                autoTranslate: 'true',
                translationScopes: 'title,content,summary,category,tags,coverImage',
            },
        })
        expect(resetTranslationProgress).not.toHaveBeenCalled()
        expect(translationDialogVisible.value).toBe(false)
    })

    it('openTranslationWorkflow 默认打开弹窗并回填来源与目标语言', async () => {
        const { openTranslationWorkflow, resetTranslationProgress, translationDialogVisible, translationWorkflowDefaults } = createComposable({
            sourcePostSnapshot: null,
            initialTranslations: [{
                id: 'fallback-source-id',
                title: '回退来源',
                language: 'en-US',
                translationId: 'cluster-a',
                status: PostStatus.DRAFT,
            }],
        })

        await openTranslationWorkflow(null)

        expect(resetTranslationProgress).toHaveBeenCalledTimes(1)
        expect(translationDialogVisible.value).toBe(true)
        expect(translationWorkflowDefaults.value).toEqual({
            sourcePostId: 'fallback-source-id',
            targetLanguage: 'en-US',
            scopes: ['title', 'content', 'summary', 'category', 'tags', 'coverImage'],
        })
    })

    it('目标语言不同于当前编辑语言时应关闭弹窗并跳转到对应译文', async () => {
        const { handleStartTranslationWorkflow, translationDialogVisible } = createComposable({
            language: 'zh-CN',
        })

        translationDialogVisible.value = true

        await handleStartTranslationWorkflow({
            ...createWorkflowRequest(),
            targetLanguage: 'en-US',
        })

        expect(translationDialogVisible.value).toBe(false)
        expect(mockNavigateTo).toHaveBeenCalledWith({
            path: '/admin/posts/new',
            query: {
                language: 'en-US',
                sourceId: 'source-post-id',
                translationId: 'shared-post-cluster',
                autoTranslate: 'true',
                translationScopes: 'tags',
            },
        })
    })

    it('来源快照缺失且接口返回空值时应中止翻译流程', async () => {
        mockFetch.mockResolvedValue({ data: null })

        const { handleStartTranslationWorkflow, translatePostFields } = createComposable({
            language: 'zh-CN',
            sourcePostSnapshot: {
                ...createSourcePost(),
                id: 'cached-source-id',
            },
            isNew: false,
            postOverrides: {
                id: 'current-post-id',
                title: '已有标题',
            },
        })

        await handleStartTranslationWorkflow({
            ...createWorkflowRequest(),
            sourcePostId: 'another-source-id',
            sourceLanguage: 'en-US',
            targetLanguage: 'zh-CN',
            targetState: 'draft',
            action: 'continue',
            scopes: ['title'],
        })

        expect(mockFetch).toHaveBeenCalledWith('/api/posts/another-source-id')
        expect(translatePostFields).not.toHaveBeenCalled()
    })

    it('已发布目标拒绝第一次确认时不应继续翻译', async () => {
        const confirmRequire = vi.fn((options: { reject: () => void }) => options.reject())
        const { handleStartTranslationWorkflow, translatePostFields } = createComposable({
            language: 'zh-CN',
            isNew: false,
            postOverrides: {
                id: 'current-post-id',
                title: '已有标题',
            },
            confirmRequire,
        })

        await handleStartTranslationWorkflow({
            ...createWorkflowRequest(),
            sourceLanguage: 'en-US',
            targetLanguage: 'zh-CN',
            targetState: 'published',
            action: 'overwrite',
            scopes: ['title'],
        })

        expect(confirmRequire).toHaveBeenCalledTimes(1)
        expect(translatePostFields).not.toHaveBeenCalled()
    })

    it('已发布目标第二次确认拒绝时也应中止翻译', async () => {
        const confirmRequire = vi.fn((options: { accept: () => void, reject: () => void }) => {
            if (confirmRequire.mock.calls.length === 1) {
                options.accept()
                return
            }

            options.reject()
        })

        const { handleStartTranslationWorkflow, translatePostFields } = createComposable({
            language: 'zh-CN',
            isNew: false,
            postOverrides: {
                id: 'current-post-id',
                title: '已有标题',
            },
            confirmRequire,
        })

        await handleStartTranslationWorkflow({
            ...createWorkflowRequest(),
            sourceLanguage: 'en-US',
            targetLanguage: 'zh-CN',
            targetState: 'published',
            action: 'overwrite',
            scopes: ['title'],
        })

        expect(confirmRequire).toHaveBeenCalledTimes(2)
        expect(translatePostFields).not.toHaveBeenCalled()
    })

    it('草稿继续翻译时应使用 warn 确认并在接受后继续', async () => {
        const confirmRequire = vi.fn((options: { accept: () => void }) => options.accept())

        const { handleStartTranslationWorkflow, translatePostFields } = createComposable({
            language: 'zh-CN',
            isNew: false,
            postOverrides: {
                id: 'current-post-id',
                title: '已有标题',
            },
            confirmRequire,
        })

        await handleStartTranslationWorkflow({
            ...createWorkflowRequest(),
            sourceLanguage: 'en-US',
            targetLanguage: 'zh-CN',
            targetState: 'draft',
            action: 'continue',
            scopes: ['title'],
        })

        expect(confirmRequire).toHaveBeenCalledWith(expect.objectContaining({
            header: 'pages.admin.posts.translation_workflow.continue_title',
            message: 'pages.admin.posts.translation_workflow.continue_draft',
        }))
        expect(translatePostFields).toHaveBeenCalledTimes(1)
    })

    it('目标草稿所选范围没有内容时应跳过确认并直接继续翻译', async () => {
        const confirmRequire = vi.fn()

        const { handleStartTranslationWorkflow, translatePostFields } = createComposable({
            language: 'zh-CN',
            isNew: false,
            postOverrides: {
                id: 'current-post-id',
                title: '',
            },
            confirmRequire,
        })

        await handleStartTranslationWorkflow({
            ...createWorkflowRequest(),
            sourceLanguage: 'en-US',
            targetLanguage: 'zh-CN',
            scopes: ['title'],
            targetState: 'draft',
            action: 'continue',
        })

        expect(confirmRequire).not.toHaveBeenCalled()
        expect(translatePostFields).toHaveBeenCalledTimes(1)
    })
})
