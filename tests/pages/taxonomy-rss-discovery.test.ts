import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import CategoryPage from '@/pages/categories/[slug].vue'
import TagPage from '@/pages/tags/[slug].vue'

const hoisted = vi.hoisted(() => ({
    state: {
        routeSlug: 'rss-tech',
        category: {
            id: 'category-1',
            name: 'RSS Tech',
            slug: 'rss-tech',
            description: 'Category description',
            language: 'zh-CN',
        },
        tag: {
            id: 'tag-1',
            name: 'FeedTag',
            slug: 'feed-tag',
            language: 'en-US',
        },
    },
    capturedHeadEntries: [] as Record<string, unknown>[],
    mockUsePageSeo: vi.fn(),
    mockNavigateTo: vi.fn(),
    mockOnPageChange: vi.fn(),
}))

function resolveTotalCount(params?: Record<string, unknown>) {
    const count = params?.count

    if (typeof count === 'number' || typeof count === 'string') {
        return count
    }

    return 0
}

function localizePath(path: string, locale?: string | null) {
    if (!locale || locale === 'zh-CN') {
        return path
    }

    return path === '/'
        ? `/${locale}`
        : `/${locale}${path}`
}

function translate(key: string, params?: Record<string, unknown>) {
    switch (key) {
        case 'common.category':
            return 'Category'
        case 'common.tag':
            return 'Tag'
        case 'common.rss':
            return 'RSS'
        case 'pages.posts.title':
            return 'Posts'
        case 'pages.posts.empty':
            return 'Empty'
        case 'app.description':
            return 'Site description'
        case 'pages.posts.total_count':
            return `${resolveTotalCount(params)} posts`
        default:
            return key
    }
}

mockNuxtImport('definePageMeta', () => vi.fn())
mockNuxtImport('navigateTo', () => hoisted.mockNavigateTo)
mockNuxtImport('useRoute', () => () => ({ params: { slug: hoisted.state.routeSlug } }))
mockNuxtImport('useRouter', () => () => ({
    push: vi.fn(),
    replace: vi.fn(() => Promise.resolve()),
    currentRoute: ref({
        fullPath: `/categories/${hoisted.state.routeSlug}`,
        path: `/categories/${hoisted.state.routeSlug}`,
        params: { slug: hoisted.state.routeSlug },
        meta: {},
    }),
    afterEach: vi.fn(),
    beforeEach: vi.fn(),
    beforeResolve: vi.fn(),
    onError: vi.fn(),
}))
mockNuxtImport('useI18n', () => () => ({ t: translate }))
mockNuxtImport('useLocalePath', () => () => (route: string | { path?: string }, locale?: string | null) => {
    const path = typeof route === 'string' ? route : route.path || '/'
    return localizePath(path, locale)
})
mockNuxtImport('useRuntimeConfig', () => () => ({
    app: {
        baseURL: '/',
    },
    public: {
        siteUrl: 'https://momei.app',
    },
}))
mockNuxtImport('useAppFetch', () => (url: string | (() => string)) => {
    const resolvedUrl = typeof url === 'function' ? url() : url

    if (resolvedUrl.startsWith('/api/categories/slug/')) {
        return Promise.resolve({
            data: ref({ data: hoisted.state.category }),
            pending: ref(false),
            error: ref(null),
        })
    }

    if (resolvedUrl.startsWith('/api/tags/slug/')) {
        return Promise.resolve({
            data: ref({ data: hoisted.state.tag }),
            pending: ref(false),
            error: ref(null),
        })
    }

    return Promise.resolve({
        data: ref({ data: null }),
        pending: ref(false),
        error: ref(null),
    })
})
mockNuxtImport('useTaxonomyPostPage', () => () => Promise.resolve({
    page: ref(1),
    limit: ref(10),
    first: ref(0),
    posts: ref([{ id: 'post-1', title: 'Post 1' }]),
    total: ref(3),
    totalPages: ref(1),
    postsPending: ref(false),
    postsError: ref(null),
    onPageChange: hoisted.mockOnPageChange,
}))
mockNuxtImport('usePageSeo', () => hoisted.mockUsePageSeo)
mockNuxtImport('useHead', () => (input: Record<string, unknown> | (() => Record<string, unknown>)) => {
    hoisted.capturedHeadEntries.push(typeof input === 'function' ? input() : input)
})

const stubs = {
    ArticleCard: { template: '<article class="article-card">ArticleCard</article>' },
    Button: { template: '<button><slot /></button>' },
    Message: { template: '<div><slot /></div>' },
    Paginator: { template: '<div class="paginator" />' },
    RssIcon: { template: '<svg class="rss-icon" />' },
    Skeleton: { template: '<div class="skeleton" />' },
}

describe('taxonomy RSS discovery', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        hoisted.capturedHeadEntries.length = 0
        hoisted.state.routeSlug = 'rss-tech'
        hoisted.state.category = {
            id: 'category-1',
            name: 'RSS Tech',
            slug: 'rss-tech',
            description: 'Category description',
            language: 'zh-CN',
        }
        hoisted.state.tag = {
            id: 'tag-1',
            name: 'FeedTag',
            slug: 'feed-tag',
            language: 'en-US',
        }
    })

    it('renders category RSS link and injects discovery head link', async () => {
        const wrapper = await mountSuspended(CategoryPage, {
            route: '/categories/rss-tech',
            global: {
                stubs,
                mocks: {
                    $t: translate,
                },
            },
        })

        await flushPromises()

        expect(wrapper.html()).toContain('/feed/category/rss-tech.xml?language=zh-CN')
        expect(hoisted.capturedHeadEntries).toContainEqual({
            link: [
                {
                    rel: 'canonical',
                    href: 'https://momei.app/categories/rss-tech',
                },
                {
                    rel: 'alternate',
                    type: 'application/rss+xml',
                    title: 'RSS Tech RSS',
                    href: '/feed/category/rss-tech.xml?language=zh-CN',
                },
            ],
        })
        expect(hoisted.mockUsePageSeo).toHaveBeenCalled()

        const seoOptions = hoisted.mockUsePageSeo.mock.calls[0]?.[0]
        const structuredData = seoOptions.structuredData()

        expect(seoOptions.locale()).toBe('zh-CN')
        expect(seoOptions.path()).toBe('/categories/rss-tech')
        expect(structuredData).toHaveLength(1)
        expect(structuredData[0]).toMatchObject({ '@type': 'BreadcrumbList' })
        expect(structuredData[0].itemListElement[0].item).toBe('https://momei.app/')
        expect(structuredData[0].itemListElement[1].item).toBe('https://momei.app/categories')
        expect(structuredData[0].itemListElement[2].item).toBe('https://momei.app/categories/rss-tech')
    })

    it('renders tag RSS link and injects discovery head link', async () => {
        hoisted.state.routeSlug = 'feed-tag'

        const wrapper = await mountSuspended(TagPage, {
            route: '/tags/feed-tag',
            global: {
                stubs,
                mocks: {
                    $t: translate,
                },
            },
        })

        await flushPromises()

        expect(wrapper.html()).toContain('/feed/tag/feed-tag.xml?language=en-US')
        expect(hoisted.capturedHeadEntries).toContainEqual({
            link: [
                {
                    rel: 'canonical',
                    href: 'https://momei.app/en-US/tags/feed-tag',
                },
                {
                    rel: 'alternate',
                    type: 'application/rss+xml',
                    title: 'FeedTag RSS',
                    href: '/feed/tag/feed-tag.xml?language=en-US',
                },
            ],
        })
        expect(hoisted.mockUsePageSeo).toHaveBeenCalled()

        const seoOptions = hoisted.mockUsePageSeo.mock.calls[0]?.[0]
        const structuredData = seoOptions.structuredData()

        expect(seoOptions.locale()).toBe('en-US')
        expect(seoOptions.path()).toBe('/en-US/tags/feed-tag')
        expect(structuredData).toHaveLength(1)
        expect(structuredData[0]).toMatchObject({ '@type': 'BreadcrumbList' })
        expect(structuredData[0].itemListElement[0].item).toBe('https://momei.app/en-US')
        expect(structuredData[0].itemListElement[1].item).toBe('https://momei.app/en-US/tags')
        expect(structuredData[0].itemListElement[2].item).toBe('https://momei.app/en-US/tags/feed-tag')
    })
})
