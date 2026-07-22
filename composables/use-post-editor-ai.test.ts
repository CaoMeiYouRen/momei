import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
})
