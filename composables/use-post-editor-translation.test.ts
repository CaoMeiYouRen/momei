import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { usePostEditorTranslation } from './use-post-editor-translation'
import type { PostEditorData } from '@/types/post-editor'
import type {
    PostTagBindingInput,
    PostTranslationSourceDetail,
    PostTranslationTagOption,
    PostTranslationWorkflowRequest,
} from '@/types/post-translation'
import { PostStatus, PostVisibility } from '@/types/post'

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
}) {
    const post = createPostEditorState(options?.language)
    post.value.tags = [...(options?.initialTags || [])]
    const tagBindings = ref<PostTagBindingInput[]>([...(options?.initialTagBindings || [])])
    const translateTaxonomyNames = options?.translateTaxonomyNames || vi.fn((names: string[], targetLanguage: string) => Promise.resolve(names.map((name) => `${name}-${targetLanguage}`)))
    const toastAdd = vi.fn()
    const translatePostFields = vi.fn(() => Promise.resolve(true))

    const composable = usePostEditorTranslation({
        post,
        isNew: computed(() => true),
        localeItems: computed(() => []),
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
        translateTaxonomyNames,
        translatePostFields,
        resetTranslationProgress: vi.fn(),
    })

    composable.sourcePostSnapshot.value = createSourcePost()

    return {
        post,
        tagBindings,
        toastAdd,
        translateTaxonomyNames,
        translatePostFields,
        ...composable,
    }
}

describe('usePostEditorTranslation', () => {
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

        await handleStartTranslationWorkflow(createWorkflowRequest())

        expect(post.value.tags).toEqual(['Generated Target Tag'])
        expect(tagBindings.value).toEqual([{
            name: 'Generated Target Tag',
            translationId: 'shared-tag-cluster',
            sourceTagSlug: 'source-tag',
            sourceTagId: 'source-tag-id',
        }])
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
