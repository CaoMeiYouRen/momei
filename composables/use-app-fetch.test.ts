import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useAppApi, useAppFetch } from './use-app-fetch'

// Mock Nuxt composables
vi.mock('#app', () => ({
    useFetch: vi.fn((url, options) => ({
        data: ref(null),
        pending: ref(false),
        error: ref(null),
        refresh: vi.fn(),
        url,
        options,
    })),
}))

vi.mock('#imports', () => ({
    useI18n: vi.fn(() => ({
        locale: ref('zh-CN'),
    })),
    $fetch: vi.fn(),
}))

describe('useAppFetch', () => {
    it('should append language to query parameters', () => {
        const { useFetch } = require('#app')
        const { useI18n } = require('#imports')

        useI18n.mockReturnValue({ locale: ref('en-US') })

        const result = useAppFetch('/api/posts')

        expect(useFetch).toHaveBeenCalled()
        const callArgs = useFetch.mock.calls[0]
        expect(callArgs[0]).toBe('/api/posts')
        expect(callArgs[1].query).toBeDefined()
    })

    it('should merge existing query parameters with language', () => {
        const { useFetch } = require('#app')
        const { useI18n } = require('#imports')

        useI18n.mockReturnValue({ locale: ref('zh-CN') })

        const existingQuery = { page: 1, limit: 10 }
        useAppFetch('/api/posts', { query: existingQuery })

        expect(useFetch).toHaveBeenCalled()
    })

    it('should handle reactive query parameters', () => {
        const { useFetch } = require('#app')
        const { useI18n } = require('#imports')

        useI18n.mockReturnValue({ locale: ref('en-US') })

        const page = ref(1)
        useAppFetch('/api/posts', { query: { page } })

        expect(useFetch).toHaveBeenCalled()
    })

    it('should work with function URL', () => {
        const { useFetch } = require('#app')
        const { useI18n } = require('#imports')

        useI18n.mockReturnValue({ locale: ref('en-US') })

        const urlFn = () => '/api/posts'
        useAppFetch(urlFn)

        expect(useFetch).toHaveBeenCalledWith(urlFn, expect.any(Object))
    })
})

describe('useAppApi', () => {
    it('should return $appFetch function', () => {
        const { useI18n } = require('#imports')
        useI18n.mockReturnValue({ locale: ref('zh-CN') })

        const { $appFetch } = useAppApi()

        expect($appFetch).toBeDefined()
        expect(typeof $appFetch).toBe('function')
    })

    it('should append language to query in $appFetch', async () => {
        const { useI18n, $fetch } = require('#imports')
        useI18n.mockReturnValue({ locale: ref('en-US') })
        $fetch.mockResolvedValue({ data: [] })

        const { $appFetch } = useAppApi()
        await $appFetch('/api/posts')

        expect($fetch).toHaveBeenCalledWith('/api/posts', expect.objectContaining({
            query: expect.objectContaining({
                language: 'en-US',
            }),
        }))
    })

    it('should merge existing query parameters', async () => {
        const { useI18n, $fetch } = require('#imports')
        useI18n.mockReturnValue({ locale: ref('zh-CN') })
        $fetch.mockResolvedValue({ data: [] })

        const { $appFetch } = useAppApi()
        await $appFetch('/api/posts', { query: { page: 1 } })

        expect($fetch).toHaveBeenCalledWith('/api/posts', expect.objectContaining({
            query: expect.objectContaining({
                language: 'zh-CN',
                page: 1,
            }),
        }))
    })

    it('should handle reactive query parameters', async () => {
        const { useI18n, $fetch } = require('#imports')
        useI18n.mockReturnValue({ locale: ref('en-US') })
        $fetch.mockResolvedValue({ data: [] })

        const { $appFetch } = useAppApi()
        const page = ref(2)
        await $appFetch('/api/posts', { query: { page } })

        expect($fetch).toHaveBeenCalledWith('/api/posts', expect.objectContaining({
            query: expect.objectContaining({
                language: 'en-US',
                page: 2,
            }),
        }))
    })
})
