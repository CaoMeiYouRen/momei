import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const sharedLocale = ref('zh-CN')

const { mockUseFetch } = vi.hoisted(() => ({
    mockUseFetch: vi.fn((url: any, options: any) => ({
        data: ref(null),
        pending: ref(false),
        error: ref(null),
        refresh: vi.fn(),
        url,
        options,
    })),
}))

mockNuxtImport('useI18n', () => () => ({
    locale: sharedLocale,
}))

mockNuxtImport('useFetch', () => mockUseFetch)

// $fetch 比较特殊，它是 ofetch 提供的
vi.stubGlobal('$fetch', vi.fn())

import { useAppApi, useAppFetch } from './use-app-fetch'

describe('useAppFetch', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        sharedLocale.value = 'zh-CN'
    })

    it('should append language to query parameters', () => {
        sharedLocale.value = 'en-US'

        const result = useAppFetch('/api/posts') as any

        expect(mockUseFetch).toHaveBeenCalled()
        expect(result.options.query.value.language).toBe('en-US')
    })

    it('should merge existing query parameters with language', () => {
        sharedLocale.value = 'zh-CN'

        const result = useAppFetch('/api/posts', { query: { page: 1 } }) as any

        expect(mockUseFetch).toHaveBeenCalled()
        expect(result.options.query.value.language).toBe('zh-CN')
        expect(result.options.query.value.page).toBe(1)
    })

    it('should handle reactive query parameters', () => {
        sharedLocale.value = 'en-US'

        const page = ref(1)
        const result = useAppFetch('/api/posts', { query: { page } }) as any

        expect(mockUseFetch).toHaveBeenCalled()
        expect(result.options.query.value.language).toBe('en-US')
        expect(result.options.query.value.page).toBe(1)
    })

    it('should work with function URL', () => {
        sharedLocale.value = 'en-US'

        const urlFn = () => '/api/posts'
        void useAppFetch(urlFn)

        expect(mockUseFetch).toHaveBeenCalledWith(urlFn, expect.any(Object), expect.anything())
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
