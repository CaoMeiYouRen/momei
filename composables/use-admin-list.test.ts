import { defineComponent, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const mockLocale = ref('zh-CN')
const mockContentLanguage = ref<string | null>('en-US')
const fetchMock = vi.fn()

mockNuxtImport('useI18n', () => () => ({
    locale: mockLocale,
}))

vi.mock('./use-admin-i18n', () => ({
    useAdminI18n: () => ({
        contentLanguage: mockContentLanguage,
    }),
}))

vi.stubGlobal('$fetch', fetchMock)

import { useAdminList } from './use-admin-list'

async function flushPromises() {
    await Promise.resolve()
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
}

async function mountAdminList<T>(options: Parameters<typeof useAdminList<T>>[0]) {
    let composable: ReturnType<typeof useAdminList<T>> | null = null

    const TestComponent = defineComponent({
        setup() {
            composable = useAdminList<T>(options)
            return () => null
        },
    })

    await mountSuspended(TestComponent)
    await flushPromises()

    if (!composable) {
        throw new Error('useAdminList was not initialized')
    }

    return composable as ReturnType<typeof useAdminList<T>>
}

describe('useAdminList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        fetchMock.mockReset()
        mockLocale.value = 'zh-CN'
        mockContentLanguage.value = 'en-US'
    })

    it('应在 mounted 时通过 fetchFn 加载并清理空过滤条件', async () => {
        const fetchFn = vi.fn().mockResolvedValue({
            data: [{ id: 'item-1' }],
            total: 1,
        })

        const list = await mountAdminList<{ id: string }>({
            fetchFn,
            initialLimit: 20,
            initialFilters: {
                status: 'draft',
                keyword: '',
                aggregate: true,
            },
        })

        expect(fetchFn).toHaveBeenCalledWith({
            page: 1,
            offset: 0,
            limit: 20,
            orderBy: 'createdAt',
            order: 'DESC',
            sortBy: 'createdAt',
            sortDirection: 'desc',
            status: 'draft',
            aggregate: true,
            language: 'en-US',
            scope: 'manage',
        })
        expect(list.items.value).toEqual([{ id: 'item-1' }])
        expect(list.pagination.value).toEqual({
            page: 1,
            limit: 20,
            total: 1,
        })
        expect(list.error.value).toBeNull()
    })

    it('当内容语言为空且开启 aggregate 时应回退到当前 locale', async () => {
        mockLocale.value = 'ja-JP'
        mockContentLanguage.value = null
        fetchMock.mockResolvedValueOnce({
            code: 200,
            data: {
                list: [{ id: 'item-2' }],
                total: 2,
            },
        })

        const list = await mountAdminList<{ id: string }>({
            url: '/api/admin/posts',
            initialFilters: {
                aggregate: true,
            },
        })

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/posts', {
            params: expect.objectContaining({
                language: 'ja-JP',
                aggregate: true,
            }),
        })
        expect(list.items.value).toEqual([{ id: 'item-2' }])
        expect(list.pagination.value.total).toBe(2)
    })

    it('分页、排序和语言变化时应重新加载列表', async () => {
        const fetchFn = vi.fn().mockResolvedValue({
            data: [],
            total: 0,
        })

        const list = await mountAdminList({
            fetchFn,
            initialFilters: {
                aggregate: true,
            },
        })

        fetchFn.mockClear()

        list.onPage({ page: 2, rows: 30 })
        await flushPromises()
        expect(fetchFn).toHaveBeenLastCalledWith(expect.objectContaining({
            page: 3,
            offset: 60,
            limit: 30,
        }))

        list.onSort({ sortField: 'title', sortOrder: 1 })
        await flushPromises()
        expect(fetchFn).toHaveBeenLastCalledWith(expect.objectContaining({
            orderBy: 'title',
            order: 'ASC',
            sortBy: 'title',
            sortDirection: 'asc',
        }))

        const callsBeforeInvalidSort = fetchFn.mock.calls.length
        list.onSort({ sortField: (item) => String(item), sortOrder: -1 })
        await flushPromises()
        expect(fetchFn).toHaveBeenCalledTimes(callsBeforeInvalidSort)

        mockContentLanguage.value = 'zh-CN'
        await nextTick()
        await flushPromises()
        expect(fetchFn).toHaveBeenLastCalledWith(expect.objectContaining({
            language: 'zh-CN',
        }))
    })

    it('应处理非 200 响应与异常细节', async () => {
        fetchMock.mockResolvedValueOnce({
            code: 500,
            message: 'server_failed',
            data: {
                total: 0,
            },
        })

        const responseList = await mountAdminList({
            url: '/api/admin/posts',
        })
        expect(responseList.error.value).toBe('server_failed')

        const fetchFn = vi.fn().mockRejectedValue({
            data: {
                message: 'request_failed',
            },
        })
        const thrownList = await mountAdminList({
            fetchFn,
        })

        expect(thrownList.error.value).toBe('request_failed')
    })
})
