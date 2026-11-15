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

vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('caomei-ui')>()

    return {
        ...actual,
        useToast: () => createLegacyToastApi(mockToastAdd),
    }
})

vi.mock('@vueuse/core', () => ({
    useIntervalFn: () => ({ pause: vi.fn(), resume: vi.fn() }),
}))

import { usePostEditorAI } from './use-post-editor-ai'
import { createLegacyToastApi } from '@/tests/helpers/caomei-service-mocks'

function createPost(overrides: Record<string, unknown> = {}) {
    return ref({
        title: '标题',
        content: '这是一段足够长的正文内容，用于触发合并审校的两个接口调用。',
        summary: '',
        language: 'zh-CN',
        slug: '',
        ...overrides,
    })
}

function createAI(post = createPost()) {
    return { ai: usePostEditorAI(post as never, ref<string[]>([]), ref<string[]>([])) }
}

const REVIEW_PAYLOAD = {
    data: [{ type: 'grammar', severity: 'minor', original: 'a', suggestion: 'b' }],
}

const PERSPECTIVE_PAYLOAD = {
    data: [{ mode: 'editor', type: 'clarity', severity: 'minor', suggestion: '更清晰', reason: '理由' }],
}

describe('usePostEditorAI - consolidatedReview', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockReset()
    })

    it('并行调用审查与视角接口，合并结果并打开面板', async () => {
        mockFetch
            .mockResolvedValueOnce(REVIEW_PAYLOAD)
            .mockResolvedValueOnce(PERSPECTIVE_PAYLOAD)

        const { ai } = createAI()

        await ai.consolidatedReview()

        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(mockFetch.mock.calls[0]?.[0]).toBe('/api/ai/review')
        expect(mockFetch.mock.calls[1]?.[0]).toBe('/api/ai/perspective-check')
        expect(mockFetch.mock.calls[1]?.[1]).toMatchObject({
            body: { mode: 'editor' },
        })
        expect(ai.reviewSuggestions.value).toHaveLength(1)
        expect(ai.perspectiveResults.value).toHaveLength(1)
        expect(ai.consolidatedPanelVisible.value).toBe(true)
        expect(ai.consolidatedTab.value).toBe('review')
        expect(ai.consolidatedFailedSections.value).toEqual([])
        expect(ai.aiLoading.value.review).toBe(false)
        expect(ai.aiLoading.value.perspective).toBe(false)
    })

    it('部分失败时降级为 warning 并记录失败分段', async () => {
        mockFetch
            .mockResolvedValueOnce(REVIEW_PAYLOAD)
            .mockRejectedValueOnce(new Error('perspective boom'))

        const { ai } = createAI()

        await ai.consolidatedReview()

        expect(ai.consolidatedPanelVisible.value).toBe(true)
        expect(ai.consolidatedFailedSections.value).toEqual(['perspective'])
        expect(ai.reviewSuggestions.value).toHaveLength(1)
        expect(ai.perspectiveResults.value).toEqual([])
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            detail: 'pages.admin.posts.ai.consolidated_partial_failure',
        }))
        expect(ai.aiLoading.value.review).toBe(false)
        expect(ai.aiLoading.value.perspective).toBe(false)
    })

    it('审查失败、视角成功时同样降级并保留视角结果', async () => {
        mockFetch
            .mockRejectedValueOnce(new Error('review boom'))
            .mockResolvedValueOnce(PERSPECTIVE_PAYLOAD)

        const { ai } = createAI()

        await ai.consolidatedReview()

        expect(ai.consolidatedPanelVisible.value).toBe(true)
        expect(ai.consolidatedFailedSections.value).toEqual(['review'])
        expect(ai.perspectiveResults.value).toHaveLength(1)
        expect(ai.reviewSuggestions.value).toEqual([])
    })

    it('部分失败后在面板内重试成功会清除失败分段', async () => {
        mockFetch
            .mockResolvedValueOnce(REVIEW_PAYLOAD)
            .mockRejectedValueOnce(new Error('perspective boom'))
            .mockResolvedValueOnce(PERSPECTIVE_PAYLOAD)

        const { ai } = createAI()
        await ai.consolidatedReview()
        expect(ai.consolidatedFailedSections.value).toEqual(['perspective'])

        await ai.perspectiveCheck('reader', { showPanel: false })

        expect(ai.consolidatedFailedSections.value).toEqual([])
        expect(ai.perspectiveResults.value).toHaveLength(1)
    })

    it('两处都失败时不打开面板并提示错误', async () => {
        mockFetch
            .mockRejectedValueOnce(new Error('review boom'))
            .mockRejectedValueOnce(new Error('perspective boom'))

        const { ai } = createAI()

        await ai.consolidatedReview()

        expect(ai.consolidatedPanelVisible.value).toBe(false)
        expect(ai.aiLoading.value.review).toBe(false)
        expect(ai.aiLoading.value.perspective).toBe(false)
        expect(ai.consolidatedFailedSections.value).toEqual(['review', 'perspective'])
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.admin.posts.ai_error',
        }))
    })

    it('两处结果均为空时给出整体良好提示', async () => {
        mockFetch
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] })

        const { ai } = createAI()

        await ai.consolidatedReview()

        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            summary: 'pages.admin.posts.ai.consolidated_clean',
            detail: 'pages.admin.posts.ai.consolidated_clean_desc',
        }))
    })

    it('内容未变化且两处均有缓存时不重复请求', async () => {
        mockFetch
            .mockResolvedValueOnce(REVIEW_PAYLOAD)
            .mockResolvedValueOnce(PERSPECTIVE_PAYLOAD)

        const { ai } = createAI()
        await ai.consolidatedReview()
        const callsAfterFirst = mockFetch.mock.calls.length
        ai.consolidatedPanelVisible.value = false

        await ai.consolidatedReview()

        expect(mockFetch.mock.calls.length).toBe(callsAfterFirst)
        expect(ai.consolidatedPanelVisible.value).toBe(true)
        expect(mockToastAdd).toHaveBeenLastCalledWith(expect.objectContaining({
            severity: 'info',
            detail: 'pages.admin.posts.ai.review_cached',
        }))
    })

    it('已有一轮审校在途时抑制重复请求', async () => {
        const { ai } = createAI()
        ai.aiLoading.value.review = true

        await ai.consolidatedReview()

        expect(mockFetch).not.toHaveBeenCalled()
        expect(ai.consolidatedPanelVisible.value).toBe(false)
    })

    it('正文过短时给出警告且不请求接口', async () => {
        const { ai } = createAI(createPost({ content: '太短' }))

        await ai.consolidatedReview()

        expect(mockFetch).not.toHaveBeenCalled()
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            detail: 'pages.admin.posts.content_too_short',
        }))
    })

    it('正文语言变化后缓存失效并重新请求', async () => {
        mockFetch
            .mockResolvedValueOnce(REVIEW_PAYLOAD)
            .mockResolvedValueOnce(PERSPECTIVE_PAYLOAD)
            .mockResolvedValueOnce(REVIEW_PAYLOAD)
            .mockResolvedValueOnce(PERSPECTIVE_PAYLOAD)

        const post = createPost()
        const { ai } = createAI(post)
        await ai.consolidatedReview()

        post.value.language = 'en-US'
        await ai.consolidatedReview()

        expect(mockFetch).toHaveBeenCalledTimes(4)
    })

    it('零结果同样参与缓存：二次调用不重复请求', async () => {
        mockFetch
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({ data: [] })

        const { ai } = createAI()
        await ai.consolidatedReview()
        await ai.consolidatedReview()

        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(mockToastAdd).toHaveBeenLastCalledWith(expect.objectContaining({
            severity: 'info',
            detail: 'pages.admin.posts.ai.review_cached',
        }))
    })

    it('双失败后再次触发必须重新请求并清除失败分段', async () => {
        mockFetch
            .mockRejectedValueOnce(new Error('review boom'))
            .mockRejectedValueOnce(new Error('perspective boom'))
            .mockResolvedValueOnce(REVIEW_PAYLOAD)
            .mockResolvedValueOnce(PERSPECTIVE_PAYLOAD)

        const { ai } = createAI()
        await ai.consolidatedReview()
        expect(ai.consolidatedFailedSections.value).toEqual(['review', 'perspective'])

        await ai.consolidatedReview()

        expect(mockFetch).toHaveBeenCalledTimes(4)
        expect(ai.consolidatedFailedSections.value).toEqual([])
        expect(ai.consolidatedPanelVisible.value).toBe(true)
    })

    it('旧审查入口成功后只清除 review 失败分段', async () => {
        mockFetch
            .mockRejectedValueOnce(new Error('review boom'))
            .mockRejectedValueOnce(new Error('perspective boom'))
            .mockResolvedValueOnce(REVIEW_PAYLOAD)

        const { ai } = createAI()
        await ai.consolidatedReview()
        expect(ai.consolidatedFailedSections.value).toEqual(['review', 'perspective'])

        await ai.reviewContent()

        expect(ai.consolidatedFailedSections.value).toEqual(['perspective'])
        expect(ai.reviewSuggestions.value).toHaveLength(1)
    })

    it('视角检查在途时忽略重复触发', async () => {
        const { ai } = createAI()
        ai.aiLoading.value.perspective = true

        await ai.perspectiveCheck('reader', { showPanel: false })

        expect(mockFetch).not.toHaveBeenCalled()
    })

    it('旧审查入口同样按 language 失效缓存', async () => {
        mockFetch
            .mockResolvedValueOnce(REVIEW_PAYLOAD)
            .mockResolvedValueOnce(REVIEW_PAYLOAD)

        const post = createPost()
        const { ai } = createAI(post)
        await ai.reviewContent()

        post.value.language = 'en-US'
        await ai.reviewContent()

        expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('仅视角缓存失效时只补请求视角接口', async () => {
        mockFetch
            .mockResolvedValueOnce(REVIEW_PAYLOAD)
            .mockResolvedValueOnce(PERSPECTIVE_PAYLOAD)
            .mockResolvedValueOnce(PERSPECTIVE_PAYLOAD)

        const post = createPost()
        const { ai } = createAI(post)
        await ai.consolidatedReview()

        // 切换视角模式会改变含 mode 的缓存键，仅视角需要重新获取
        ai.perspectiveMode.value = 'reader'
        await ai.perspectiveCheck('reader', { showPanel: false })

        expect(mockFetch).toHaveBeenCalledTimes(3)
        expect(mockFetch.mock.calls.at(-1)?.[0]).toBe('/api/ai/perspective-check')
    })

    it('不 await 连续触发两次时只发起一轮请求', async () => {
        let resolveReview: (value: unknown) => void = () => undefined
        const reviewPromise = new Promise((resolve) => {
            resolveReview = resolve
        })
        mockFetch
            .mockImplementationOnce(() => reviewPromise)
            .mockResolvedValueOnce(PERSPECTIVE_PAYLOAD)

        const { ai } = createAI()
        const first = ai.consolidatedReview()
        const second = ai.consolidatedReview()

        expect(mockFetch).toHaveBeenCalledTimes(2)

        resolveReview(REVIEW_PAYLOAD)
        await Promise.all([first, second])

        expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('切换读者视角时只刷新视角结果，不打开旧面板', async () => {
        mockFetch.mockResolvedValueOnce({
            data: [{ mode: 'reader', type: 'engagement', severity: 'info', suggestion: '更吸引', reason: '理由' }],
        })

        const { ai } = createAI()

        await ai.perspectiveCheck('reader', { showPanel: false })

        expect(ai.perspectiveMode.value).toBe('reader')
        expect(ai.perspectiveResults.value).toHaveLength(1)
        expect(ai.perspectivePanelVisible.value).toBe(false)
    })
})
