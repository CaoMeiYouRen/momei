import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import { useAdminEntityList } from './use-admin-entity-list'

async function flushPromises() {
    await Promise.resolve()
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
}

async function mountAdminEntityList<T>(options: Parameters<typeof useAdminEntityList<T>>[0]) {
    let composable: ReturnType<typeof useAdminEntityList<T>> | null = null

    const TestComponent = defineComponent({
        setup() {
            composable = useAdminEntityList<T>(options)
            return () => null
        },
    })

    await mountSuspended(TestComponent)
    await flushPromises()

    if (!composable) {
        throw new Error('useAdminEntityList was not initialized')
    }

    return composable as ReturnType<typeof useAdminEntityList<T>>
}

describe('useAdminEntityList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('应在 mounted 时加载列表', async () => {
        const loadItems = vi.fn().mockResolvedValue([{ id: 'item-1' }])

        const list = await mountAdminEntityList<{ id: string }>({
            loadItems,
        })

        expect(loadItems).toHaveBeenCalledTimes(1)
        expect(list.items.value).toEqual([{ id: 'item-1' }])
        expect(list.loading.value).toBe(false)
    })

    it('刷新失败时应保留上次成功数据', async () => {
        const loadItems = vi
            .fn<() => Promise<{ id: string }[]>>()
            .mockResolvedValueOnce([{ id: 'item-1' }])
            .mockRejectedValueOnce(new Error('refresh failed'))

        const list = await mountAdminEntityList<{ id: string }>({
            loadItems,
        })

        await list.refresh()
        await flushPromises()

        expect(loadItems).toHaveBeenCalledTimes(2)
        expect(list.items.value).toEqual([{ id: 'item-1' }])
        expect(list.loading.value).toBe(false)
    })
})
