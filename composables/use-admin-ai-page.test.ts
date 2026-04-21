import { defineComponent, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const fetchMock = vi.fn()
const showErrorToast = vi.fn()
const showSuccessToast = vi.fn()
const resolveErrorMessage = vi.fn(() => 'resolved-load-error')
const confirmRequire = vi.fn()

vi.mock('primevue/useconfirm', () => ({
    useConfirm: () => ({
        require: confirmRequire,
    }),
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
    locale: ref('zh-CN'),
}))

mockNuxtImport('useAppApi', () => () => ({
    $appFetch: fetchMock,
}))

mockNuxtImport('useRequestFeedback', () => () => ({
    resolveErrorMessage,
    showErrorToast,
    showSuccessToast,
}))

async function flushPromises() {
    await Promise.resolve()
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
}

async function mountComposable() {
    let composable: any = null
    const { useAdminAiPage } = await import('./use-admin-ai-page')

    const TestComponent = defineComponent({
        setup() {
            composable = useAdminAiPage()
            return () => null
        },
    })

    await mountSuspended(TestComponent)
    await flushPromises()

    if (!composable) {
        throw new Error('useAdminAiPage was not initialized')
    }

    return composable
}

const listItem = {
    id: 'task-1',
    category: 'podcast',
    type: 'podcast',
    status: 'completed',
    provider: 'volcengine',
    model: 'seed-tts-2.0',
    estimatedCost: 1.2,
    actualCost: 1.1,
    estimatedQuotaUnits: 10,
    quotaUnits: 9,
    chargeStatus: 'actual',
    failureStage: null,
    durationMs: 2000,
    createdAt: '2026-03-08T00:00:00.000Z',
    startedAt: '2026-03-08T00:00:01.000Z',
    completedAt: '2026-03-08T00:00:03.000Z',
    userId: 'user-1',
    user_name: 'Author',
    user_email: 'author@example.com',
    user_image: null,
}

const detailItem = {
    ...listItem,
    usageSnapshot: { textChars: 1024 },
    payload: { text: 'hello world' },
    result: { audioUrl: '/audio.mp3' },
    error: null,
    audioDuration: 120,
    audioSize: 2048,
    textLength: 1024,
    language: 'zh-CN',
}

const costDisplay = {
    currencyCode: 'CNY',
    currencySymbol: '¥',
    quotaUnitPrice: 0.1,
}

function createStatsResponse() {
    return {
        overview: {
            totalTasks: 1,
            estimatedCost: 1.2,
            actualCost: 1.1,
            estimatedQuotaUnits: 10,
            quotaUnits: 9,
            avgDurationMs: 2000,
            successRate: 100,
            failureRate: 0,
        },
        statusStats: [],
        typeStats: [],
        categoryStats: [],
        chargeStatusStats: [],
        failureStageStats: [],
        modelStats: [],
        topUsers: [],
        dailyTrend: [],
        alerts: [],
        costDisplay,
    }
}

function createTasksResponse() {
    return {
        items: [listItem],
        total: 1,
        costDisplay,
    }
}

describe('useAdminAiPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        fetchMock.mockReset()
        showErrorToast.mockReset()
        showSuccessToast.mockReset()
        resolveErrorMessage.mockReset()
        resolveErrorMessage.mockReturnValue('resolved-load-error')
    })

    it('should load stats and task list on mount', async () => {
        fetchMock.mockImplementation((url: string) => {
            if (url === '/api/admin/ai/stats') {
                return Promise.resolve(createStatsResponse())
            }

            if (url === '/api/admin/ai/tasks') {
                return Promise.resolve(createTasksResponse())
            }

            throw new Error(`Unexpected URL: ${url}`)
        })

        const composable = await mountComposable()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/ai/tasks', {
            query: {
                page: 1,
                pageSize: 10,
                type: null,
                status: null,
                search: '',
            },
        })
        expect(fetchMock).toHaveBeenCalledWith('/api/admin/ai/stats')
        expect(composable.tasks.value).toEqual([listItem])
        expect(composable.stats.value).toEqual(expect.objectContaining({
            overview: expect.objectContaining({
                totalTasks: 1,
            }),
        }))
    })

    it('should fetch task detail lazily when showing details', async () => {
        fetchMock.mockImplementation((url: string) => {
            if (url === '/api/admin/ai/stats') {
                return Promise.resolve(createStatsResponse())
            }

            if (url === '/api/admin/ai/tasks') {
                return Promise.resolve(createTasksResponse())
            }

            if (url === '/api/ai/tasks/task-1') {
                return Promise.resolve({
                    code: 200,
                    data: {
                        item: detailItem,
                        costDisplay,
                    },
                })
            }

            throw new Error(`Unexpected URL: ${url}`)
        })

        const composable = await mountComposable()
        await composable.showDetails(listItem)
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledWith('/api/ai/tasks/task-1')
        expect(composable.detailsVisible.value).toBe(true)
        expect(composable.loadingTaskDetails.value).toBe(false)
        expect(composable.taskDetailsError.value).toBeNull()
        expect(composable.selectedTask.value).toEqual(detailItem)
    })

    it('should expose inline detail error when lazy detail fetch fails', async () => {
        fetchMock.mockImplementation((url: string) => {
            if (url === '/api/admin/ai/stats') {
                return Promise.resolve(createStatsResponse())
            }

            if (url === '/api/admin/ai/tasks') {
                return Promise.resolve(createTasksResponse())
            }

            if (url === '/api/ai/tasks/task-1') {
                return Promise.reject(new Error('detail_failed'))
            }

            throw new Error(`Unexpected URL: ${url}`)
        })

        const composable = await mountComposable()
        await composable.showDetails(listItem)
        await flushPromises()

        expect(composable.detailsVisible.value).toBe(true)
        expect(composable.loadingTaskDetails.value).toBe(false)
        expect(composable.selectedTask.value).toBeNull()
        expect(composable.taskDetailsError.value).toBe('resolved-load-error')
        expect(showErrorToast).toHaveBeenCalledWith(expect.any(Error), {
            fallbackKey: 'pages.admin.ai.feedback.load_tasks_failed',
        })
    })
})
