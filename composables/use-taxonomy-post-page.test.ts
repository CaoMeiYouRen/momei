import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const {
    routeState,
    routerState,
    routerPushMock,
    setI18nParamsMock,
    useAppFetchMock,
    postsDataRef,
    pendingRef,
    errorRef,
} = vi.hoisted(() => ({
    routeState: {
        query: {} as Record<string, string | undefined>,
    },
    routerState: {
        push: vi.fn(),
        afterEach: vi.fn(),
        beforeEach: vi.fn(),
        beforeResolve: vi.fn(),
        onError: vi.fn(),
    },
    routerPushMock: vi.fn(),
    setI18nParamsMock: vi.fn(),
    useAppFetchMock: vi.fn(),
    postsDataRef: { value: null as unknown },
    pendingRef: { value: false },
    errorRef: { value: null as unknown },
}))

mockNuxtImport('useRoute', () => () => routeState)
mockNuxtImport('useRouter', () => () => routerState)
mockNuxtImport('useSetI18nParams', () => () => setI18nParamsMock)
mockNuxtImport('useAppFetch', () => useAppFetchMock)

import { useTaxonomyPostPage } from './use-taxonomy-post-page'

describe('useTaxonomyPostPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        routeState.query = {}
        routerState.push = routerPushMock
        postsDataRef.value = {
            data: {
                items: [{ id: 'post-1', title: 'Nuxt' }],
                total: 18,
                totalPages: 2,
            },
        }
        pendingRef.value = false
        errorRef.value = null
        useAppFetchMock.mockImplementation(() => ({
            data: postsDataRef,
            pending: pendingRef,
            error: errorRef,
        }))
        Object.defineProperty(window, 'scrollTo', {
            configurable: true,
            value: vi.fn(),
        })
    })

    it('binds route pagination and taxonomy slug into the posts query', async () => {
        routeState.query = { page: '3' }

        const result = await useTaxonomyPostPage({
            filterKey: 'tag',
            slug: computed(() => 'nuxt'),
            entityData: computed(() => ({
                translations: [
                    { language: 'en-US', slug: 'nuxt' },
                    { language: 'zh-CN', slug: 'nuxt-cn' },
                ],
            })),
        })

        const options = useAppFetchMock.mock.calls[0]?.[1]
        expect(useAppFetchMock).toHaveBeenCalledWith('/api/posts', expect.any(Object))
        expect(options.query.page.value).toBe(3)
        expect(options.query.tag.value).toBe('nuxt')
        expect(options.query.status).toBe('published')
        expect(options.watch).toHaveLength(2)
        expect(result.posts.value).toEqual([{ id: 'post-1', title: 'Nuxt' }])
        expect(result.total.value).toBe(18)
        expect(result.totalPages.value).toBe(2)
        expect(setI18nParamsMock).toHaveBeenCalledWith({
            'en-US': { slug: 'nuxt' },
            'zh-CN': { slug: 'nuxt-cn' },
        })
    })

    it('updates paging state, pushes the new route query and scrolls to top', async () => {
        routeState.query = { page: '1', view: 'compact' }

        const result = await useTaxonomyPostPage({
            filterKey: 'category',
            slug: computed(() => 'frontend'),
            entityData: computed(() => null),
        })

        result.onPageChange({ page: 1, first: 10 })

        expect(result.page.value).toBe(2)
        expect(result.first.value).toBe(10)
        expect(routerPushMock).toHaveBeenCalledWith({
            query: {
                page: 2,
                view: 'compact',
            },
        })
        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
        expect(setI18nParamsMock).not.toHaveBeenCalled()
    })
})
