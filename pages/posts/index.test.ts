import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { nextTick, reactive, ref } from 'vue'
import PostsIndexPage from './index.vue'

// Mock data
const mockPosts = [
    { id: '1', title: 'Post 1' },
    { id: '2', title: 'Post 2' },
]

// Control useAppFetch state
const mockFetchData = ref<any>({
    data: {
        items: mockPosts,
        total: 2,
        totalPages: 1,
        limit: 10,
    },
})
const mockFetchPending = ref(false)
const mockFetchError = ref<any>(null)
const routeQuery = reactive<{ page?: string }>({ page: '1' })
const routerPushMock = vi.fn()
const scrollToMock = vi.fn()
const mockUsePageSeo = vi.fn((config?: { title?: () => string, description?: () => string }) => {
    config?.title?.()
    config?.description?.()
})

const translate = (key: string) => {
    switch (key) {
        case 'pages.posts.title':
            return 'Posts'
        case 'pages.posts.empty':
            return 'No posts yet'
        case 'pages.posts.meta.description':
            return 'Browse all published posts.'
        default:
            return key
    }
}

Object.defineProperty(window, 'scrollTo', {
    value: scrollToMock,
    writable: true,
})

// Use mockNuxtImport for Nuxt composables
mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => translate(key),
    d: (date: string) => date,
    locale: ref('en'),
}))

mockNuxtImport('useLocalePath', () => () => (path: string) => path)

mockNuxtImport('usePageSeo', () => (...args: Parameters<typeof mockUsePageSeo>) => mockUsePageSeo(...args))

mockNuxtImport('useAppFetch', () => () => ({
    data: mockFetchData,
    pending: mockFetchPending,
    error: mockFetchError,
}))

mockNuxtImport('useRoute', () => () => ({
    params: {},
    query: routeQuery,
}))

mockNuxtImport('useRouter', () => () => ({
    push: (...args: Parameters<typeof routerPushMock>) => routerPushMock(...args),
    replace: vi.fn(() => Promise.resolve()),
    afterEach: vi.fn(),
    beforeEach: vi.fn(),
    beforeResolve: vi.fn(),
    onError: vi.fn(),
}))

// Stub components
const stubs = {
    Skeleton: { template: '<div class="skeleton"><slot /></div>' },
    Message: { template: '<div v-if="severity" class="message">{{ text }}<slot /></div>', props: ['severity', 'text'] },
    Paginator: {
        template: '<button class="paginator" :data-first="first" :data-rows="rows" :data-total-records="totalRecords" @click="$emit(\'page\', {page: 1, first: rows})"><slot /></button>',
        props: ['first', 'rows', 'totalRecords'],
        emits: ['page'],
    },
    ArticleCard: {
        template: '<div class="article-card">{{ post.title }}</div>',
        props: ['post', 'layout'],
    },
}

async function mountPage() {
    return mountSuspended(PostsIndexPage, {
        global: {
            stubs,
            mocks: {
                $t: translate,
            },
        },
    })
}

describe('PostsIndexPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        routeQuery.page = '1'
        mockUsePageSeo.mockClear()
        // Reset fetch state
        mockFetchData.value = {
            data: {
                items: mockPosts,
                total: 2,
                totalPages: 1,
                limit: 10,
            },
        }
        mockFetchPending.value = false
        mockFetchError.value = null
    })

    it('装配真实文章列表页文案而不是显示 raw key', async () => {
        const wrapper = await mountPage()
        const text = wrapper.text()

        expect(wrapper.find('.posts-page__title').exists()).toBe(true)
        expect(text).toContain('Posts')
        expect(text).not.toContain('pages.posts.title')
        expect(text).not.toContain('pages.posts.empty')
        expect(mockUsePageSeo).toHaveBeenCalled()
    })

    it('shows skeleton when pending', async () => {
        // Set pending state
        mockFetchPending.value = true

        const wrapper = await mountPage()

        // When pending is true, skeletons should be shown
        const skeletons = wrapper.findAll('.posts-page__skeleton')
        // The component renders 6 skeletons when pending
        expect(skeletons.length).toBe(6)
    })

    it('shows empty state when no posts', async () => {
        // Set empty state
        mockFetchData.value = { data: { items: [], total: 0, totalPages: 0, limit: 10 } }
        mockFetchPending.value = false

        const wrapper = await mountPage()

        // When data is empty and not pending, empty state should show
        expect(wrapper.find('.posts-page__empty').exists()).toBe(true)
        expect(wrapper.text()).toContain('No posts yet')
    })

    it('shows error state when there is an error', async () => {
        // Set error state
        mockFetchError.value = { message: 'Error message' }

        const wrapper = await mountPage()

        // Error state div should exist in template
        expect(wrapper.find('.posts-page__error').exists()).toBe(true)
        expect(wrapper.find('.posts-page__error').text()).toContain('Error message')
    })

    it('navigates with paginator and scrolls to the top', async () => {
        // Set multiple pages state
        mockFetchData.value = { data: { items: mockPosts, total: 20, totalPages: 4, limit: 5 } }

        const wrapper = await mountPage()
        const paginator = wrapper.find('.paginator')

        expect(wrapper.find('.posts-page__pagination').exists()).toBe(true)
        await paginator.trigger('click')

        expect(routerPushMock).toHaveBeenCalledWith({ query: { page: 2 } })
        expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
        expect(paginator.attributes('data-first')).toBe('5')
    })

    it('syncs paginator offset from reactive route query changes', async () => {
        mockFetchData.value = { data: { items: mockPosts, total: 20, totalPages: 4, limit: 5 } }

        const wrapper = await mountPage()
        routeQuery.page = '3'
        await nextTick()
        await nextTick()

        expect(wrapper.find('.paginator').attributes('data-first')).toBe('10')
    })

    it('has correct CSS class structure', async () => {
        const wrapper = await mountPage()

        expect(wrapper.find('.posts-page').exists()).toBe(true)
        expect(wrapper.find('.posts-page__list').exists()).toBe(true)
    })
})

