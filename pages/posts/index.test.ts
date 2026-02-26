import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
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
    },
})
const mockFetchPending = ref(false)
const mockFetchError = ref<any>(null)

// Use mockNuxtImport for Nuxt composables
mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
    d: (date: string) => date,
    locale: ref('en'),
}))

mockNuxtImport('useLocalePath', () => () => (path: string) => path)

mockNuxtImport('useHead', () => vi.fn())

mockNuxtImport('useAppFetch', () => () => ({
    data: mockFetchData,
    pending: mockFetchPending,
    error: mockFetchError,
}))

mockNuxtImport('useRoute', () => () => ({
    params: {},
    query: { page: '1' },
}))

mockNuxtImport('useRouter', () => () => ({
    push: vi.fn(),
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
        template: '<div class="paginator" @click="$emit(\'page\', {page: 0, first: 0})"><slot /></div>',
        props: ['first', 'rows', 'totalRecords'],
        emits: ['page'],
    },
    ArticleCard: {
        template: '<div class="article-card">{{ post.title }}</div>',
        props: ['post', 'layout'],
    },
}

describe('PostsIndexPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset fetch state
        mockFetchData.value = {
            data: {
                items: mockPosts,
                total: 2,
                totalPages: 1,
            },
        }
        mockFetchPending.value = false
        mockFetchError.value = null
    })

    it('renders page title correctly', async () => {
        const wrapper = await mountSuspended(PostsIndexPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.posts-page__title').exists()).toBe(true)
    })

    it('shows skeleton when pending', async () => {
        // Set pending state
        mockFetchPending.value = true

        const wrapper = await mountSuspended(PostsIndexPage, {
            global: {
                stubs,
            },
        })

        // When pending is true, skeletons should be shown
        const skeletons = wrapper.findAll('.posts-page__skeleton')
        // The component renders 6 skeletons when pending
        expect(skeletons.length).toBe(6)
    })

    it('shows empty state when no posts', async () => {
        // Set empty state
        mockFetchData.value = { data: { items: [], total: 0, totalPages: 0 } }
        mockFetchPending.value = false

        const wrapper = await mountSuspended(PostsIndexPage, {
            global: {
                stubs,
            },
        })

        // When data is empty and not pending, empty state should show
        expect(wrapper.find('.posts-page__empty').exists()).toBe(true)
    })

    it('shows error state when there is an error', async () => {
        // Set error state
        mockFetchError.value = { message: 'Error message' }

        const wrapper = await mountSuspended(PostsIndexPage, {
            global: {
                stubs,
            },
        })

        // Error state div should exist in template
        expect(wrapper.find('.posts-page__error').exists()).toBe(true)
        expect(wrapper.find('.posts-page__error').text()).toContain('Error message')
    })

    it('renders paginator when there are multiple pages', async () => {
        // Set multiple pages state
        mockFetchData.value = { data: { items: [], total: 20, totalPages: 2 } }

        const wrapper = await mountSuspended(PostsIndexPage, {
            global: {
                stubs,
            },
        })

        // Paginator should be present in template
        expect(wrapper.find('.posts-page__pagination').exists()).toBe(true)
    })

    it('has correct CSS class structure', async () => {
        const wrapper = await mountSuspended(PostsIndexPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.posts-page').exists()).toBe(true)
        expect(wrapper.find('.posts-page__list').exists()).toBe(true)
    })
})

