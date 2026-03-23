import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { hasUnsavedNewDraftContent, usePostEditorTranslation } from './use-post-editor-translation'
import type { PostEditorData } from '@/types/post-editor'
import type {
    PostTagBindingInput,
    PostTranslationSourceDetail,
    PostTranslationTagOption,
    PostTranslationWorkflowRequest,
} from '@/types/post-translation'
import { PostStatus, PostVisibility } from '@/types/post'

const { mockNavigateTo } = vi.hoisted(() => ({
    mockNavigateTo: vi.fn(),
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)

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
    tagEntities?: PostTranslationTagOption[]
    translateTaxonomyNames?: (names: string[], targetLanguage: string) => Promise<string[]>
    initialTags?: string[]
    initialTagBindings?: PostTagBindingInput[]
    isNew?: boolean
    sourcePostSnapshot?: PostTranslationSourceDetail | null
}) {
    const post = createPostEditorState(options?.language)
    post.value.tags = [...(options?.initialTags || [])]
    const tagBindings = ref<PostTagBindingInput[]>([...(options?.initialTagBindings || [])])
    const translateTaxonomyNames = options?.translateTaxonomyNames || vi.fn((names: string[], targetLanguage: string) => Promise.resolve(names.map((name) => `${name}-${targetLanguage}`)))
    const toastAdd = vi.fn()
    const translatePostFields = vi.fn(() => Promise.resolve(true))
    const beginAuxiliaryFieldProgress = vi.fn()
    const completeAuxiliaryFieldProgress = vi.fn()
    const failAuxiliaryFieldProgress = vi.fn()

    const composable = usePostEditorTranslation({
        post,
        isNew: computed(() => options?.isNew ?? true),
        localeItems: computed(() => [
            { code: 'zh-CN' },
            { code: 'en-US' },
        ]),
        categories: ref([]),
        tagEntities: ref(options?.tagEntities || []),
        toast: {
            add: toastAdd,
        },
        confirm: {
            require: vi.fn(),
        },
        t: (key: string) => key,
        localePath: (path: string) => path,
        loadCategories: vi.fn(() => Promise.resolve()),
        loadTags: vi.fn(() => Promise.resolve()),
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
        resetTranslationProgress: vi.fn(),
    })

    composable.sourcePostSnapshot.value = options?.sourcePostSnapshot === undefined
        ? createSourcePost()
        : options.sourcePostSnapshot

    return {
        post,
        tagBindings,
        toastAdd,
        translateTaxonomyNames,
        translatePostFields,
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
})
