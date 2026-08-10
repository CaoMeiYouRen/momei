import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFetch, mockToastAdd } = vi.hoisted(() => ({
    mockFetch: vi.fn(),
    mockToastAdd: vi.fn(),
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

vi.mock('primevue/usetoast', async (importOriginal) => {
    const actual = await importOriginal<typeof import('primevue/usetoast')>()

    return {
        ...actual,
        useToast: () => ({
            add: mockToastAdd,
        }),
    }
})

vi.mock('@vueuse/core', () => ({
    useIntervalFn: (callback: () => void) => ({
        pause: vi.fn(),
        resume: vi.fn(() => {
            callback()
        }),
    }),
}))

import { usePostEditorAI } from './use-post-editor-ai'

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
