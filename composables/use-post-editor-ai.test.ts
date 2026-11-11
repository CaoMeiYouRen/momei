import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFetch, mockToastAdd, intervalControls } = vi.hoisted(() => ({
    mockFetch: vi.fn(),
    mockToastAdd: vi.fn(),
    intervalControls: {
        callback: null as null | (() => void),
        pause: vi.fn(),
        resume: vi.fn(),
    },
}))

vi.mock('ofetch', () => ({ $fetch: mockFetch }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: mockFetch }))

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: (key: string) => key,
        }),
    }
})

vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('caomei-ui')>()

    return {
        ...actual,
        useToast: () => createLegacyToastApi(mockToastAdd),
    }
})

vi.mock('@vueuse/core', () => ({
    useIntervalFn: (callback: () => void) => {
        intervalControls.callback = callback

        return {
            pause: intervalControls.pause,
            resume: intervalControls.resume,
        }
    },
}))

import { usePostEditorAI } from './use-post-editor-ai'
import { createLegacyToastApi } from '@/tests/helpers/caomei-service-mocks'

describe('usePostEditorAI', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockReset()
    })

    it('shows title suggestions and opens the overlay', async () => {
        mockFetch.mockResolvedValueOnce({
            data: ['Suggested title'],
        })

        const post = ref({
            title: '',
            content: 'This is a long enough article body for AI suggestions.',
            summary: '',
            language: 'zh-CN',
            slug: '',
        })
        const allTags = ref<string[]>([])
        const selectedTags = ref<string[]>([])
        const overlayShow = vi.fn()

        const ai = usePostEditorAI(post as never, allTags, selectedTags)
        ai.titleOp.value = {
            show: overlayShow,
        }

        const triggerEvent = {
            currentTarget: document.createElement('button'),
        }

        await ai.suggestTitles(triggerEvent)

        expect(ai.titleSuggestions.value).toEqual(['Suggested title'])
        expect(overlayShow).toHaveBeenCalledTimes(1)
    })

    it('shows error toast when suggestTitles API fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        const post = ref({
            title: '',
            content: 'This is a long enough article body for AI suggestions.',
            summary: '',
            language: 'zh-CN',
            slug: '',
        })
        const overlayShow = vi.fn()

        const ai = usePostEditorAI(post as never, ref([]), ref([]))
        ai.titleOp.value = { show: overlayShow }

        const triggerEvent = {
            currentTarget: document.createElement('button'),
        }

        await ai.suggestTitles(triggerEvent)

        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.ai_error',
        }))
        expect(ai.titleSuggestions.value).toEqual([])
        expect(ai.aiLoading.value.title).toBe(false)
    })

    it('shows error toast when suggestSlug API fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        const post = ref({
            title: 'Test Title',
            content: 'This is a long enough article body for AI slug.',
            summary: '',
            language: 'zh-CN',
            slug: '',
        })

        const ai = usePostEditorAI(post as never, ref([]), ref([]))

        await ai.suggestSlug()

        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.ai_error',
        }))
        expect(post.value.slug).toBe('')
        expect(ai.aiLoading.value.slug).toBe(false)
    })

    it('shows error toast when suggestSummary API fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        const post = ref({
            title: '',
            content: 'This is a long enough article body for AI summary.',
            summary: '',
            language: 'zh-CN',
            slug: '',
        })

        const ai = usePostEditorAI(post as never, ref([]), ref([]))

        await ai.suggestSummary()

        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.ai_error',
        }))
        expect(post.value.summary).toBe('')
        expect(ai.aiLoading.value.summary).toBe(false)
    })

    it('translates title, summary and content, then reports success', async () => {
        mockFetch
            .mockResolvedValueOnce({ data: { data: 'Translated title' }.data })
            .mockResolvedValueOnce({ data: { mode: 'direct', content: 'Translated summary' } })
            .mockResolvedValueOnce({ data: { mode: 'direct', content: 'Translated content' } })

        const post = ref({
            title: 'Source title',
            content: 'This is a long enough article body for AI translation.',
            summary: 'Summary text',
            language: 'en-US',
            slug: '',
        })

        const ai = usePostEditorAI(post as never, ref([]), ref([]))

        await ai.translateContent('ja-JP')

        expect(post.value.title).toBe('Translated title')
        expect(post.value.summary).toBe('Translated summary')
        expect(post.value.content).toBe('Translated content')
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.admin.posts.translate_success',
        }))
    })

    // --- 续写 / 扩写 / 缩写：style 参数传递 ---

    const mountEditorTextarea = (value = '这是一段足够长的文章内容，用于 AI 续写与扩写测试。') => {
        const textarea = document.createElement('textarea')
        textarea.className = 'auto-textarea-input'
        textarea.value = value
        document.body.appendChild(textarea)
        return textarea
    }

    const setupPost = () => ref({
        title: '',
        content: '这是一段足够长的文章内容，用于 AI 续写与扩写测试。',
        summary: '',
        language: 'zh-CN',
        slug: '',
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('passes style to continue API and inserts result at cursor', async () => {
        mockFetch.mockResolvedValueOnce({ data: '这是续写的后续内容。' })

        const post = setupPost()
        const textarea = mountEditorTextarea()
        // 光标前需要有足够长的上下文（>=10 字符）
        textarea.setSelectionRange(15, 15)

        const ai = usePostEditorAI(post as never, ref([]), ref([]))
        await ai.continueContent('formal')

        expect(mockFetch).toHaveBeenCalledWith('/api/ai/continue', expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({ style: 'formal' }),
        }))
        expect(post.value.content).toContain('这是续写的后续内容。')
    })

    it('passes style to expand API and replaces selection', async () => {
        mockFetch.mockResolvedValueOnce({ data: '扩写后的更详细内容。' })

        const post = setupPost()
        const textarea = mountEditorTextarea()
        textarea.setSelectionRange(0, 10)

        const ai = usePostEditorAI(post as never, ref([]), ref([]))
        await ai.expandContent('technical')

        expect(mockFetch).toHaveBeenCalledWith('/api/ai/expand', expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({ style: 'technical' }),
        }))
        expect(post.value.content).toContain('扩写后的更详细内容。')
    })

    it('passes style to condense API and replaces selection', async () => {
        mockFetch.mockResolvedValueOnce({ data: '精简后的内容。' })

        const post = setupPost()
        const textarea = mountEditorTextarea()
        textarea.setSelectionRange(0, 10)

        const ai = usePostEditorAI(post as never, ref([]), ref([]))
        await ai.condenseContent('concise')

        expect(mockFetch).toHaveBeenCalledWith('/api/ai/condense', expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({ style: 'concise' }),
        }))
        expect(post.value.content).toContain('精简后的内容。')
    })

    it('defaults to casual style when none is passed', async () => {
        mockFetch.mockResolvedValueOnce({ data: '扩写结果。' })

        const post = setupPost()
        const textarea = mountEditorTextarea()
        textarea.setSelectionRange(0, 10)

        const ai = usePostEditorAI(post as never, ref([]), ref([]))
        await ai.expandContent()

        expect(mockFetch).toHaveBeenCalledWith('/api/ai/expand', expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({ style: 'casual' }),
        }))
    })
})

describe('usePostEditorAI 结果回写、缓存与失败分支', () => {
    const LONG_CONTENT = '这是一段足够长的文章正文内容，用于 AI 行为测试与回归覆盖。'

    const createPost = (overrides: Record<string, string> = {}) => ref({
        title: '原标题',
        content: LONG_CONTENT,
        summary: '',
        language: 'zh-CN',
        slug: '',
        ...overrides,
    })

    const mountTextarea = (value: string, start = 0, end = 0) => {
        const textarea = document.createElement('textarea')
        textarea.className = 'auto-textarea-input'
        textarea.value = value
        document.body.appendChild(textarea)
        textarea.setSelectionRange(start, end)

        return textarea
    }

    const createAI = (post = createPost()) => ({
        ai: usePostEditorAI(post as never, ref([]), ref([])),
        post,
    })

    beforeEach(() => {
        mockFetch.mockReset()
        mockToastAdd.mockReset()
        intervalControls.callback = null
        intervalControls.pause.mockReset()
        intervalControls.resume.mockReset()
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    it.each([
        ['suggestTitles', (ai: ReturnType<typeof usePostEditorAI>) => ai.suggestTitles({ target: document.createElement('button') })],
        ['suggestSlug', (ai: ReturnType<typeof usePostEditorAI>) => ai.suggestSlug()],
        ['suggestSummary', (ai: ReturnType<typeof usePostEditorAI>) => ai.suggestSummary()],
        ['recommendTags', (ai: ReturnType<typeof usePostEditorAI>) => ai.recommendTags()],
        ['reviewContent', (ai: ReturnType<typeof usePostEditorAI>) => ai.reviewContent()],
        ['perspectiveCheck', (ai: ReturnType<typeof usePostEditorAI>) => ai.perspectiveCheck()],
    ])('%s 在正文过短时给出警告且不请求接口', async (_name, invoke) => {
        const { ai } = createAI(createPost({ content: '太短' }))

        await invoke(ai)

        expect(mockFetch).not.toHaveBeenCalled()
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            detail: 'pages.admin.posts.content_too_short',
        }))
    })

    it('正文过短时翻译同样被拦截', async () => {
        const { ai } = createAI(createPost({ content: '太短' }))

        await ai.translateContent('ja-JP')

        expect(mockFetch).not.toHaveBeenCalled()
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            detail: 'pages.admin.posts.content_too_short',
        }))
    })

    it('回写 slug 与摘要，并在标签推荐时跳过已选标签', async () => {
        mockFetch
            .mockResolvedValueOnce({ data: 'generated-slug' })
            .mockResolvedValueOnce({ data: '生成的摘要' })
            .mockResolvedValueOnce({ data: ['nuxt', 'vue'] })

        const { ai, post } = createAI()
        const selectedTags = ref(['nuxt'])
        const withTags = usePostEditorAI(post as never, ref(['existing']), selectedTags)

        await ai.suggestSlug()
        await ai.suggestSummary()
        await withTags.recommendTags()

        expect(post.value.slug).toBe('generated-slug')
        expect(post.value.summary).toBe('生成的摘要')
        expect(selectedTags.value).toEqual(['nuxt', 'vue'])
        expect(mockFetch).toHaveBeenLastCalledWith('/api/ai/recommend-tags', expect.objectContaining({
            body: expect.objectContaining({ existingTags: ['existing'] }),
        }))
    })

    it('标题建议为空时不展示浮层，选中建议后回写标题', async () => {
        mockFetch.mockResolvedValueOnce({ data: [] })

        const { ai, post } = createAI()
        const show = vi.fn()
        const hide = vi.fn()
        ai.titleOp.value = { show, hide }

        await ai.suggestTitles({ currentTarget: document.createElement('button') })

        expect(show).not.toHaveBeenCalled()

        ai.selectTitle('新标题')

        expect(post.value.title).toBe('新标题')
        expect(hide).toHaveBeenCalledTimes(1)
    })

    it('标签推荐接口失败时提示错误并复位 loading', async () => {
        mockFetch.mockRejectedValueOnce(new Error('boom'))

        const { ai } = createAI()

        await ai.recommendTags()

        expect(ai.aiLoading.value.tags).toBe(false)
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.ai_error',
        }))
    })

    // --- 翻译：异步任务轮询三种终态 ---

    it('异步翻译任务完成时解析 JSON 字符串载荷', async () => {
        mockFetch
            .mockResolvedValueOnce({ data: { mode: 'task', taskId: 'task-1' } })
            .mockResolvedValueOnce({
                data: { status: 'completed', progress: 100, result: JSON.stringify({ content: '译文-json' }) },
            })

        const { ai, post } = createAI(createPost({ title: '', summary: '' }))

        await ai.translateContent('ja-JP')

        expect(mockFetch).toHaveBeenLastCalledWith('/api/ai/task/status/task-1')
        expect(post.value.content).toBe('译文-json')
        expect(intervalControls.pause).toHaveBeenCalled()
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.admin.posts.translate_success',
        }))
    })

    it('异步翻译任务返回纯文本与对象载荷时均可回写', async () => {
        mockFetch
            .mockResolvedValueOnce({ data: { mode: 'task', taskId: 'task-plain' } })
            .mockResolvedValueOnce({
                data: { status: 'completed', progress: 100, result: '纯文本译文' },
            })

        const plainCase = createAI(createPost({ title: '', summary: '' }))

        await plainCase.ai.translateContent('ja-JP')
        expect(plainCase.post.value.content).toBe('纯文本译文')

        mockFetch
            .mockResolvedValueOnce({ data: { mode: 'task', taskId: 'task-object' } })
            .mockResolvedValueOnce({
                data: { status: 'completed', progress: 100, result: { content: '对象译文' } },
            })

        const objectCase = createAI(createPost({ title: '', summary: '' }))

        await objectCase.ai.translateContent('ja-JP')
        expect(objectCase.post.value.content).toBe('对象译文')
    })

    it('异步翻译任务失败时提示错误', async () => {
        mockFetch
            .mockResolvedValueOnce({ data: { mode: 'task', taskId: 'task-fail' } })
            .mockResolvedValueOnce({
                data: { status: 'failed', progress: 100, error: '模型超时' },
            })

        const { ai, post } = createAI(createPost({ title: '', summary: '' }))

        await ai.translateContent('ja-JP')

        expect(post.value.content).toBe(LONG_CONTENT)
        expect(ai.aiLoading.value.translate).toBe(false)
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.ai_error',
        }))
    })

    it('轮询接口抛非 Error 时同样收敛为错误提示', async () => {
        mockFetch
            .mockResolvedValueOnce({ data: { mode: 'task', taskId: 'task-neterr' } })
            .mockRejectedValueOnce('network down')

        const { ai } = createAI(createPost({ title: '', summary: '' }))

        await ai.translateContent('ja-JP')

        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.ai_error',
        }))
    })

    it('轮询接口抛 Error 实例时透传原始错误', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        mockFetch
            .mockResolvedValueOnce({ data: { mode: 'task', taskId: 'task-err' } })
            .mockRejectedValueOnce(new Error('socket hang up'))

        const { ai } = createAI(createPost({ title: '', summary: '' }))

        await ai.translateContent('ja-JP')

        // toError 命中 `instanceof Error` 分支：原始 message 必须被保留，而不是退化为 i18n key
        expect(consoleError).toHaveBeenCalledWith('AI Translation error:', expect.objectContaining({
            message: 'socket hang up',
        }))
        consoleError.mockRestore()
    })

    it('首个轮询返回 processing 时按间隔继续轮询直到完成', async () => {
        mockFetch
            .mockResolvedValueOnce({ data: { mode: 'task', taskId: 'task-poll' } })
            .mockResolvedValueOnce({ data: { status: 'processing', progress: 40 } })
            .mockResolvedValueOnce({
                data: { status: 'completed', progress: 100, result: '轮询译文' },
            })

        const { ai, post } = createAI(createPost({ title: '', summary: '' }))
        const pending = ai.translateContent('ja-JP')

        // 首轮在 waitForTranslationTask 内立即发出，返回 processing 后仍未 settle
        await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
        expect(intervalControls.resume).toHaveBeenCalledTimes(1)
        expect(post.value.content).toBe(LONG_CONTENT)

        intervalControls.callback?.()
        await pending

        expect(mockFetch).toHaveBeenCalledTimes(3)
        expect(post.value.content).toBe('轮询译文')
    })

    // --- 改写：选中校验 / 对比确认 / 取消 ---

    it('未选中文本时改写被拦截', async () => {
        const { ai } = createAI()
        mountTextarea(LONG_CONTENT, 3, 3)

        await ai.rewriteContent()

        expect(mockFetch).not.toHaveBeenCalled()
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            detail: 'pages.admin.posts.ai.rewrite_select_first',
        }))
    })

    it('选中内容过短时改写被拦截', async () => {
        const { ai } = createAI()
        mountTextarea(LONG_CONTENT, 0, 1)

        await ai.rewriteContent()

        expect(mockFetch).not.toHaveBeenCalled()
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            detail: 'pages.admin.posts.content_too_short',
        }))
    })

    it('改写成功后确认应用替换并关闭对比面板', async () => {
        mockFetch.mockResolvedValueOnce({ data: '改写后的文本' })

        const { ai, post } = createAI(createPost({ content: '前缀改写目标后缀' }))
        mountTextarea('前缀改写目标后缀', 2, 6)

        await ai.rewriteContent('formal')

        expect(ai.rewriteCompareData.value).toEqual(expect.objectContaining({
            original: '改写目标',
            rewritten: '改写后的文本',
            style: 'formal',
        }))
        expect(ai.rewriteCompareVisible.value).toBe(true)

        ai.confirmRewrite()

        expect(post.value.content).toBe('前缀改写后的文本后缀')
        expect(ai.rewriteCompareVisible.value).toBe(false)
        expect(ai.rewriteCompareData.value).toBeNull()
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.admin.posts.ai.rewrite_success',
        }))
    })

    it('取消改写时复位状态且不修改正文', async () => {
        mockFetch.mockResolvedValueOnce({ data: '改写后的文本' })

        const { ai, post } = createAI(createPost({ content: '前缀改写目标后缀' }))
        mountTextarea('前缀改写目标后缀', 2, 6)

        await ai.rewriteContent()
        ai.cancelRewrite()

        expect(post.value.content).toBe('前缀改写目标后缀')
        expect(ai.rewriteCompareData.value).toBeNull()
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'info',
            detail: 'pages.admin.posts.ai.rewrite_cancelled',
        }))
    })

    it('改写接口失败时提示错误并复位 loading', async () => {
        mockFetch.mockRejectedValueOnce(new Error('boom'))

        const { ai } = createAI(createPost({ content: '前缀改写目标后缀' }))
        mountTextarea('前缀改写目标后缀', 2, 6)

        await ai.rewriteContent()

        expect(ai.aiLoading.value.rewrite).toBe(false)
        expect(ai.rewriteCompareVisible.value).toBe(false)
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.ai_error',
        }))
    })

    // --- 审查与视角检查：缓存命中 / 无问题 / 失败 ---

    it('审查命中缓存时不再请求接口', async () => {
        mockFetch.mockResolvedValueOnce({ data: [{ type: 'style', message: '建议' }] })

        const { ai } = createAI()

        await ai.reviewContent()
        const fetchCount = mockFetch.mock.calls.length
        await ai.reviewContent()

        expect(mockFetch).toHaveBeenCalledTimes(fetchCount)
        expect(ai.reviewSuggestions.value).toHaveLength(1)
        expect(ai.lastReviewAt.value).not.toBeNull()
        expect(mockToastAdd).toHaveBeenLastCalledWith(expect.objectContaining({
            severity: 'info',
            detail: 'pages.admin.posts.ai.review_cached',
        }))
    })

    it('审查无问题时给出 clean 提示', async () => {
        mockFetch.mockResolvedValueOnce({ data: [] })

        const { ai } = createAI()

        await ai.reviewContent()

        expect(ai.reviewPanelVisible.value).toBe(true)
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            summary: 'pages.admin.posts.ai.review_clean',
            detail: 'pages.admin.posts.ai.review_clean_desc',
        }))
    })

    it('审查接口失败时提示错误', async () => {
        mockFetch.mockRejectedValueOnce(new Error('boom'))

        const { ai } = createAI()

        await ai.reviewContent()

        expect(ai.aiLoading.value.review).toBe(false)
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.ai_error',
        }))
    })

    it('视角检查按模式缓存，命中时只切换模式', async () => {
        mockFetch.mockResolvedValueOnce({ data: [{ type: 'clarity', message: '建议' }] })

        const { ai } = createAI()

        await ai.perspectiveCheck('reader')
        await ai.perspectiveCheck('reader')

        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(ai.perspectiveMode.value).toBe('reader')
        expect(mockToastAdd).toHaveBeenLastCalledWith(expect.objectContaining({
            severity: 'info',
            detail: 'pages.admin.posts.ai.perspective_cached',
        }))
    })

    it('切换视角模式会重新请求而不是复用缓存', async () => {
        mockFetch
            .mockResolvedValueOnce({ data: [{ type: 'clarity', message: 'editor-view' }] })
            .mockResolvedValueOnce({ data: [{ type: 'clarity', message: 'reader-view' }] })

        const { ai } = createAI()

        await ai.perspectiveCheck('editor')
        await ai.perspectiveCheck('reader')

        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(mockFetch).toHaveBeenLastCalledWith('/api/ai/perspective-check', expect.objectContaining({
            body: expect.objectContaining({ mode: 'reader' }),
        }))
        expect(ai.perspectiveResults.value).toEqual([
            expect.objectContaining({ message: 'reader-view' }),
        ])
        expect(ai.perspectiveMode.value).toBe('reader')
    })

    it('视角检查无问题时给出 clean 提示', async () => {
        mockFetch.mockResolvedValueOnce({ data: [] })

        const { ai } = createAI()

        await ai.perspectiveCheck('editor')

        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            summary: 'pages.admin.posts.ai.perspective_clean',
            detail: 'pages.admin.posts.ai.perspective_clean_desc',
        }))
    })

    it('视角检查失败时提示错误', async () => {
        mockFetch.mockRejectedValueOnce(new Error('boom'))

        const { ai } = createAI()

        await ai.perspectiveCheck()

        expect(ai.aiLoading.value.perspective).toBe(false)
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.ai_error',
        }))
    })

    // --- 续写 / 扩写 / 缩写：编辑器缺失与空响应 ---

    it('续写在缺少编辑器时提示定位失败', async () => {
        const { ai } = createAI()

        await ai.continueContent()

        expect(mockFetch).not.toHaveBeenCalled()
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            detail: 'pages.admin.posts.ai.continue_no_cursor',
        }))
    })

    it('续写在光标上文过短时被拦截', async () => {
        const { ai } = createAI()
        mountTextarea(LONG_CONTENT, 5, 5)

        await ai.continueContent()

        expect(mockFetch).not.toHaveBeenCalled()
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            detail: 'pages.admin.posts.content_too_short',
        }))
    })

    it('续写返回空内容时提示错误', async () => {
        mockFetch.mockResolvedValueOnce({ data: '' })

        const { ai } = createAI()
        mountTextarea(LONG_CONTENT, 100, 100)

        await ai.continueContent()

        expect(ai.aiLoading.value.continue).toBe(false)
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.ai_error',
        }))
    })

    it('扩写与缩写在未选中文本时分别给出提示', async () => {
        const { ai } = createAI()
        mountTextarea(LONG_CONTENT, 10, 10)

        await ai.expandContent()
        await ai.condenseContent()

        expect(mockFetch).not.toHaveBeenCalled()
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            detail: 'pages.admin.posts.ai.expand_select_first',
        }))
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            detail: 'pages.admin.posts.ai.condense_select_first',
        }))
    })

    it('扩写返回空内容时提示错误', async () => {
        mockFetch.mockResolvedValueOnce({ data: '' })

        const { ai } = createAI()
        mountTextarea(LONG_CONTENT, 0, 12)

        await ai.expandContent()

        expect(ai.aiLoading.value.expand).toBe(false)
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.ai_error',
        }))
    })

    it('缩写接口失败时提示错误', async () => {
        mockFetch.mockRejectedValueOnce(new Error('boom'))

        const { ai } = createAI()
        mountTextarea(LONG_CONTENT, 0, 12)

        await ai.condenseContent()

        expect(ai.aiLoading.value.condense).toBe(false)
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.ai_error',
        }))
    })

    it('翻译接口直接返回字符串时原样回写', async () => {
        mockFetch.mockResolvedValueOnce({ data: '直返译文' })

        const { ai, post } = createAI(createPost({ title: '', summary: '' }))

        await ai.translateContent('ja-JP')

        expect(post.value.content).toBe('直返译文')
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.admin.posts.translate_success',
        }))
    })

    it('没有对比数据时确认改写不产生任何副作用', async () => {
        const { ai, post } = createAI(createPost({ content: '原始正文内容' }))

        ai.confirmRewrite()

        expect(post.value.content).toBe('原始正文内容')
        expect(mockToastAdd).not.toHaveBeenCalled()
    })

    it('扩写与缩写选中内容过短时提示正文过短', async () => {
        const { ai } = createAI(createPost({ content: '短选中内容' }))
        mountTextarea('短选中内容', 0, 3)

        await ai.expandContent()
        await ai.condenseContent()

        expect(mockFetch).not.toHaveBeenCalled()
        expect(mockToastAdd).toHaveBeenCalledTimes(2)
        expect(mockToastAdd).toHaveBeenNthCalledWith(1, expect.objectContaining({
            severity: 'warn',
            detail: 'pages.admin.posts.content_too_short',
        }))
        expect(mockToastAdd).toHaveBeenNthCalledWith(2, expect.objectContaining({
            severity: 'warn',
            detail: 'pages.admin.posts.content_too_short',
        }))
    })

    it('缩写返回空内容时提示错误', async () => {
        mockFetch.mockResolvedValueOnce({ data: '' })

        const { ai, post } = createAI()
        mountTextarea(LONG_CONTENT, 0, 12)

        await ai.condenseContent()

        expect(post.value.content).toBe(LONG_CONTENT)
        expect(ai.aiLoading.value.condense).toBe(false)
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.ai_error',
        }))
    })
})
