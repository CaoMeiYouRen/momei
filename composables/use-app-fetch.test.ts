import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const sharedLocale = ref('zh-CN')

mockNuxtImport('useI18n', () => () => ({
    locale: sharedLocale,
}))

mockNuxtImport('useFetch', () => vi.fn((url: any, options: any) => ({
    data: ref(null),
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn(),
    url,
    options,
})))

// $fetch 比较特殊，它是 ofetch 提供的
vi.stubGlobal('$fetch', vi.fn())

import { useAppApi, useAppFetch } from './use-app-fetch'

describe('useAppFetch', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        sharedLocale.value = 'zh-CN'
    })

    it('should append language to query parameters', async () => {
        sharedLocale.value = 'en-US'
        const { useFetch } = await import('#imports')

        const result = useAppFetch('/api/posts') as any

        expect(useFetch).toHaveBeenCalled()
        expect(result.options.query.value.language).toBe('en-US')
    })

    it('should merge existing query parameters with language', async () => {
        sharedLocale.value = 'zh-CN'
        const { useFetch } = await import('#imports')

        const result = useAppFetch('/api/posts', { query: { page: 1 } }) as any

        expect(useFetch).toHaveBeenCalled()
        expect(result.options.query.value.language).toBe('zh-CN')
        expect(result.options.query.value.page).toBe(1)
    })
})

describe('useAppApi', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        sharedLocale.value = 'zh-CN'
    })

    it('should append language to query in $appFetch', async () => {
        sharedLocale.value = 'en-US'

        const { $appFetch } = useAppApi()
        await $appFetch('/api/posts')

        expect(globalThis.$fetch).toHaveBeenCalledWith('/api/posts', expect.objectContaining({
            query: expect.objectContaining({
                language: 'en-US',
            }),
        }))
    })
})
