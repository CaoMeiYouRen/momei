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
    'pages.admin.posts.translation_workflow.task_fallback': 'task_fallback',
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

function createDataEvent(payload: Record<string, unknown>) {
    return `data: ${JSON.stringify(payload)}\n\n`
}

function createEndEvent() {
    return 'event: end\ndata: {}\n\n'
}

function createChunkEvent(content: string, chunkIndex = 0, totalChunks = 1, isChunkComplete = true) {
    return createDataEvent({ content, chunkIndex, totalChunks, isChunkComplete })
}

describe('usePostTranslationAI', () => {
    const fetchMock = vi.fn()
    const apiFetchMock = vi.fn()

    beforeEach(() => {
        fetchMock.mockReset()
        apiFetchMock.mockReset()
        toastAdd.mockReset()
        vi.stubGlobal('fetch', fetchMock)
        vi.stubGlobal('$fetch', apiFetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('对短文本使用直返翻译并更新字段状态', async () => {
        apiFetchMock.mockResolvedValueOnce({
            data: {
                mode: 'direct',
                content: 'Translated title',
            },
        })

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
        expect(fetchMock).not.toHaveBeenCalled()
        expect(apiFetchMock).toHaveBeenCalledTimes(1)
        expect(translationProgress.value.fields.title.mode).toBe('direct')
        expect(translationProgress.value.fields.title.status).toBe('completed')
        expect(translationProgress.value.fields.title.completedChunks).toBe(1)
    })

    it('对多块长正文保持流式回填', async () => {
        fetchMock.mockResolvedValueOnce(createStreamResponse([
            createChunkEvent('Chunk 1', 0, 2, true),
            createChunkEvent('Chunk 2', 1, 2, true),
            createEndEvent(),
        ]))

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
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(apiFetchMock).not.toHaveBeenCalled()
        expect(post.value.content).toBe('Chunk 1\n\nChunk 2')
        expect(translationProgress.value.fields.content.mode).toBe('chunk')
        expect(translationProgress.value.fields.content.completedChunks).toBe(2)
    })

    it('在 serverless 长文本场景自动回退为任务轮询并按进度回填', async () => {
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
            statusMessage: 'Long text streaming is unavailable in serverless deployment',
            data: {
                fallbackMode: 'task',
            },
        }), {
            status: 409,
            headers: {
                'Content-Type': 'application/json',
            },
        }))
        apiFetchMock
            .mockResolvedValueOnce({
                data: {
                    mode: 'task',
                    taskId: 'task-1',
                },
            })
            .mockResolvedValueOnce({
                data: {
                    status: 'processing',
                    progress: 50,
                    result: {
                        content: 'Chunk 1',
                        completedChunks: 1,
                        totalChunks: 2,
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    status: 'completed',
                    progress: 100,
                    result: {
                        content: 'Chunk 1\n\nChunk 2',
                        completedChunks: 2,
                        totalChunks: 2,
                    },
                },
            })

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
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(apiFetchMock).toHaveBeenCalledTimes(3)
        expect(post.value.content).toBe('Chunk 1\n\nChunk 2')
        expect(translationProgress.value.fields.content.mode).toBe('task')
        expect(translationProgress.value.fields.content.completedChunks).toBe(2)
        expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            detail: 'task_fallback',
        }))
    })

    it('流式模式初始化失败时会自动降级到直返回填', async () => {
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }))
        apiFetchMock.mockResolvedValueOnce({
            data: {
                mode: 'direct',
                content: 'Fallback body',
            },
        })

        const post = createPostState()
        const { translatePostFields, translationProgress } = usePostTranslationAI(post)

        const translated = await translatePostFields({
            source: createSource({ content: '需要降级' }),
            sourceLanguage: 'zh-CN',
            targetLanguage: 'en-US',
            scopes: ['content'],
        })

        expect(translated).toBe(true)
        expect(post.value.content).toBe('Fallback body')
        expect(translationProgress.value.fields.content.mode).toBe('direct')
        expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            detail: 'stream_fallback',
        }))
    })

    it('任务轮询失败后保留已完成块，并在重试时复用原 taskId 续跑', async () => {
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
            statusMessage: 'Long text streaming is unavailable in serverless deployment',
            data: {
                fallbackMode: 'task',
            },
        }), {
            status: 409,
            headers: {
                'Content-Type': 'application/json',
            },
        }))
        apiFetchMock
            .mockResolvedValueOnce({
                data: {
                    mode: 'task',
                    taskId: 'task-1',
                },
            })
            .mockResolvedValueOnce({
                data: {
                    status: 'processing',
                    progress: 50,
                    result: {
                        content: 'Chunk 1',
                        completedChunks: 1,
                        totalChunks: 2,
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    status: 'failed',
                    progress: 50,
                    error: 'chunk failed',
                    result: {
                        content: 'Chunk 1',
                        completedChunks: 1,
                        totalChunks: 2,
                        lastError: 'chunk failed',
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    status: 'processing',
                    progress: 100,
                    result: {
                        content: 'Chunk 1\n\nChunk 2',
                        completedChunks: 2,
                        totalChunks: 2,
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    status: 'completed',
                    progress: 100,
                    result: {
                        content: 'Chunk 1\n\nChunk 2',
                        completedChunks: 2,
                        totalChunks: 2,
                    },
                },
            })

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

        const retried = await retryFieldTranslation('content')

        expect(retried).toBe(true)
        expect(post.value.content).toBe('Chunk 1\n\nChunk 2')
        expect(translationProgress.value.fields.content.status).toBe('completed')
        expect(translationProgress.value.fields.content.completedChunks).toBe(2)
        expect(apiFetchMock).toHaveBeenCalledTimes(5)
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })
})
