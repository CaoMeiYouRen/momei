import { defineComponent, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const mockLocale = ref('zh-CN')
const mockContentLanguage = ref<string | null>('en-US')
const fetchMock = vi.fn()
const showErrorToast = vi.fn()

mockNuxtImport('useI18n', () => () => ({
    locale: mockLocale,
    t: (key: string) => key,
}))

mockNuxtImport('useAppApi', () => () => ({
    $appFetch: fetchMock,
}))

mockNuxtImport('useAdminI18n', () => () => ({
    contentLanguage: mockContentLanguage,
}))

mockNuxtImport('useRequestFeedback', () => () => ({
    showErrorToast,
}))

async function flushPromises() {
    await Promise.resolve()
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
}

async function mountComposable() {
    let composable: any = null
    const { useAdminContentInsightsPage } = await import('./use-admin-content-insights-page')

    const TestComponent = defineComponent({
        setup() {
            composable = useAdminContentInsightsPage()
            return () => null
        },
    })

    await mountSuspended(TestComponent)
    await flushPromises()

    if (!composable) {
        throw new Error('useAdminContentInsightsPage was not initialized')
    }

    return composable
}

const sampleResponse = {
    selectedRange: 30,
    summaries: [],
    rankings: {
        posts: [],
        tags: [],
        categories: [],
    },
    timezone: 'Asia/Shanghai',
    scope: 'all',
    contentLanguage: 'en-US',
    generatedAt: '2026-04-18T12:00:00.000Z',
}

describe('useAdminContentInsightsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        fetchMock.mockReset()
        showErrorToast.mockReset()
        mockLocale.value = 'zh-CN'
        mockContentLanguage.value = 'en-US'
    })

    it('应在 mounted 时按默认筛选加载内容洞察', async () => {
        fetchMock.mockResolvedValue(sampleResponse)

        const composable = await mountComposable()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/content-insights', {
            query: expect.objectContaining({
                range: 30,
                scope: 'all',
                contentLanguage: 'en-US',
                language: 'zh-CN',
                timezone: expect.any(String),
            }),
        })
        expect(composable.dashboard.value).toEqual(sampleResponse)
    })

    it('切换时间范围、公开范围与内容语言时应重新加载', async () => {
        fetchMock.mockResolvedValue(sampleResponse)

        const composable = await mountComposable()
        fetchMock.mockClear()

        composable.selectedRange.value = 7
        await flushPromises()
        expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/content-insights', {
            query: expect.objectContaining({
                range: 7,
                scope: 'all',
                contentLanguage: 'en-US',
                language: 'zh-CN',
            }),
        })

        composable.scope.value = 'public'
        await flushPromises()
        expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/content-insights', {
            query: expect.objectContaining({
                range: 7,
                scope: 'public',
                contentLanguage: 'en-US',
                language: 'zh-CN',
            }),
        })

        mockLocale.value = 'ja-JP'
        await nextTick()
        await flushPromises()
        expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/content-insights', {
            query: expect.objectContaining({
                language: 'ja-JP',
            }),
        })

        mockContentLanguage.value = 'ja-JP'
        await nextTick()
        await flushPromises()
        expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/content-insights', {
            query: expect.objectContaining({
                contentLanguage: 'ja-JP',
                language: 'ja-JP',
            }),
        })
    })

    it('加载失败时应走反馈通道', async () => {
        const error = new Error('boom')
        fetchMock.mockRejectedValue(error)

        await mountComposable()

        expect(showErrorToast).toHaveBeenCalledWith(error, {
            fallbackKey: 'pages.admin.dashboard.feedback.load_failed',
        })
    })

    it('未选择内容语言时不应发送空筛选参数', async () => {
        fetchMock.mockResolvedValue({
            ...sampleResponse,
            contentLanguage: null,
        })
        mockContentLanguage.value = ''

        await mountComposable()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/content-insights', {
            query: expect.objectContaining({
                contentLanguage: undefined,
                language: 'zh-CN',
            }),
        })
    })
})
