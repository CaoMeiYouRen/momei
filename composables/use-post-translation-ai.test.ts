import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePostTranslationAI } from './use-post-translation-ai'
import { PostStatus, PostVisibility } from '@/types/post'
import type { PostEditorData } from '@/types/post-editor'
import type { PostTranslationSourceDetail } from '@/types/post-translation'

const toastAdd = vi.fn()

const translations: Record<string, string> = {
    'common.success': 'success',
    'common.error': 'error',
    'common.warn': 'warn',
    'pages.admin.posts.ai_error': 'ai_error',
    'pages.admin.posts.translate_success': 'translate_success',
    'pages.admin.posts.translation_workflow.cancelled': 'cancelled',
    'pages.admin.posts.translation_workflow.stream_fallback': 'stream_fallback',
}

vi.mock('primevue/usetoast', async (importOriginal) => {
    const actual = await importOriginal<typeof import('primevue/usetoast')>()

    return {
        ...actual,
        useToast: () => ({
            add: toastAdd,
        }),
    }
})

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: (key: string, params?: Record<string, string>) => {
                const template = translations[key] || key
                if (!params) {
                    return template
                }

                return template.replace(/\{(\w+)\}/g, (_, token: string) => params[token] ?? `{${token}}`)
            },
        }),
    }
})

function createPostState() {
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
        language: 'en-US',
        translationId: null,
        views: 0,
    })
}

function createSource(overrides: Partial<PostTranslationSourceDetail> = {}): PostTranslationSourceDetail {
    return {
        id: 'source-post',
        title: '源标题',
        content: '源正文',
        summary: '源摘要',
        language: 'zh-CN',
        status: PostStatus.DRAFT,
        ...overrides,
    }
}

function createStreamResponse(blocks: string[]) {
    const encoder = new TextEncoder()

    return new Response(new ReadableStream({
        start(controller) {
            blocks.forEach((block) => {
                controller.enqueue(encoder.encode(block))
            })
            controller.close()
        },
    }), {
        status: 200,
        headers: {
            'Content-Type': 'text/event-stream',
        },
    })
}

function createChunkEvent(content: string, chunkIndex = 0, totalChunks = 1) {
    return `data: ${JSON.stringify({ content, chunkIndex, totalChunks })}\n\nevent: end\ndata: {}\n\n`
}

function createDeferred() {
    let resolve!: () => void
    const promise = new Promise<void>((innerResolve) => {
        resolve = innerResolve
    })

    return {
        promise,
        resolve,
    }
}

describe('usePostTranslationAI', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
        fetchMock.mockReset()
        toastAdd.mockReset()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('对短文本使用流式回填并更新字段状态', async () => {
        fetchMock.mockResolvedValueOnce(createStreamResponse([
            createChunkEvent('Translated title'),
        ]))

        const post = createPostState()
        const { translatePostFields, translationProgress } = usePostTranslationAI(post)

        const translated = await translatePostFields({
            source: createSource({ title: '短标题' }),
            sourceLanguage: 'zh-CN',
            targetLanguage: 'en-US',
            scopes: ['title'],
        })

        expect(translated).toBe(true)
        expect(post.value.title).toBe('Translated title')
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(translationProgress.value.fields.title.mode).toBe('stream')
        expect(translationProgress.value.fields.title.status).toBe('completed')
        expect(translationProgress.value.fields.title.completedChunks).toBe(1)
    })

    it('对长正文切换为分段回填并按块写入', async () => {
        fetchMock
            .mockResolvedValueOnce(createStreamResponse([createChunkEvent('Chunk 1')]))
            .mockResolvedValueOnce(createStreamResponse([createChunkEvent('Chunk 2')]))

        const post = createPostState()
        const { translatePostFields, translationProgress } = usePostTranslationAI(post)

        const translated = await translatePostFields({
            source: createSource({
                content: `${'a'.repeat(2500)}\n\n${'b'.repeat(2500)}`,
            }),
            sourceLanguage: 'zh-CN',
            targetLanguage: 'en-US',
            scopes: ['content'],
        })

        expect(translated).toBe(true)
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(post.value.content).toBe('Chunk 1\n\nChunk 2')
        expect(translationProgress.value.fields.content.mode).toBe('chunk')
        expect(translationProgress.value.fields.content.completedChunks).toBe(2)
    })

    it('流式模式初始化失败时会自动降级到分段回填', async () => {
        fetchMock
            .mockResolvedValueOnce(new Response(null, { status: 200 }))
            .mockResolvedValueOnce(createStreamResponse([createChunkEvent('Fallback title')]))

        const post = createPostState()
        const { translatePostFields, translationProgress } = usePostTranslationAI(post)

        const translated = await translatePostFields({
            source: createSource({ title: '需要降级' }),
            sourceLanguage: 'zh-CN',
            targetLanguage: 'en-US',
            scopes: ['title'],
        })

        expect(translated).toBe(true)
        expect(post.value.title).toBe('Fallback title')
        expect(translationProgress.value.fields.title.mode).toBe('chunk')
        expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            detail: 'stream_fallback',
        }))
    })

    it('取消分段翻译时应保留已成功回填的边界', async () => {
        const secondRequestStarted = createDeferred()

        fetchMock
            .mockResolvedValueOnce(createStreamResponse([createChunkEvent('Chunk 1')]))
            .mockImplementationOnce(async (_input: RequestInfo | URL, init?: RequestInit) => {
                secondRequestStarted.resolve()

                return await new Promise<Response>((_resolve, reject) => {
                    init?.signal?.addEventListener('abort', () => {
                        reject(new DOMException('Aborted', 'AbortError'))
                    }, { once: true })
                })
            })

        const post = createPostState()
        const { cancelFieldTranslation, translatePostFields, translationProgress } = usePostTranslationAI(post)

        const translating = translatePostFields({
            source: createSource({
                content: `${'a'.repeat(2500)}\n\n${'b'.repeat(2500)}`,
            }),
            sourceLanguage: 'zh-CN',
            targetLanguage: 'en-US',
            scopes: ['content'],
        })

        await secondRequestStarted.promise
        expect(post.value.content).toBe('Chunk 1')

        expect(cancelFieldTranslation('content')).toBe(true)

        const translated = await translating
        expect(translated).toBe(false)
        expect(post.value.content).toBe('Chunk 1')
        expect(translationProgress.value.fields.content.status).toBe('cancelled')
        expect(translationProgress.value.fields.content.canRetry).toBe(true)
        expect(translationProgress.value.fields.content.completedChunks).toBe(1)
    })

    it('分段失败后允许仅重试失败字段并续传剩余块', async () => {
        fetchMock
            .mockResolvedValueOnce(createStreamResponse([createChunkEvent('Chunk 1')]))
            .mockRejectedValueOnce(new Error('chunk failed'))

        const post = createPostState()
        const { retryFieldTranslation, translatePostFields, translationProgress } = usePostTranslationAI(post)

        const translated = await translatePostFields({
            source: createSource({
                content: `${'a'.repeat(2500)}\n\n${'b'.repeat(2500)}`,
            }),
            sourceLanguage: 'zh-CN',
            targetLanguage: 'en-US',
            scopes: ['content'],
        })

        expect(translated).toBe(false)
        expect(post.value.content).toBe('Chunk 1')
        expect(translationProgress.value.fields.content.status).toBe('failed')
        expect(translationProgress.value.fields.content.canRetry).toBe(true)
        expect(translationProgress.value.fields.content.completedChunks).toBe(1)

        fetchMock.mockResolvedValueOnce(createStreamResponse([createChunkEvent('Chunk 2')]))

        const retried = await retryFieldTranslation('content')
        expect(retried).toBe(true)
        expect(post.value.content).toBe('Chunk 1\n\nChunk 2')
        expect(translationProgress.value.fields.content.status).toBe('completed')
        expect(translationProgress.value.fields.content.completedChunks).toBe(2)
    })
})
