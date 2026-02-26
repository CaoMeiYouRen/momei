import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import TagsIndexPage from './index.vue'

// Mock locale
const mockLocale = ref('en')

// Control useAppFetch state
const mockFetchData = ref<any>({
    data: {
        items: [
            { id: '1', name: 'Tag 1', slug: 'tag-1', postCount: 10 },
            { id: '2', name: 'Tag 2', slug: 'tag-2', postCount: 5 },
        ],
        total: 2,
    },
})
const mockFetchPending = ref(false)
const mockFetchError = ref<any>(null)

// Use mockNuxtImport for Nuxt composables
mockNuxtImport('useI18n', () => () => ({
    t: (key: string, params?: any) => {
        if (params?.count !== undefined) {
            return `${key} (${params.count})`
        }
        return key
    },
    locale: mockLocale,
}))

mockNuxtImport('useLocalePath', () => () => (path: string) => path)

mockNuxtImport('useHead', () => vi.fn())

mockNuxtImport('useAppFetch', () => () => ({
    data: mockFetchData,
    pending: mockFetchPending,
    error: mockFetchError,
}))

// Stub components
const stubs = {
    Skeleton: { template: '<div class="skeleton"><slot /></div>' },
    Message: { template: '<div v-if="severity" class="message">{{ text }}<slot /></div>', props: ['severity', 'text'] },
    NuxtLink: { template: '<a :href="to" class="nuxt-link"><slot /></a>', props: ['to'] },
}

describe('TagsIndexPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset fetch state
        mockFetchData.value = {
            data: {
                items: [
                    { id: '1', name: 'Tag 1', slug: 'tag-1', postCount: 10 },
                    { id: '2', name: 'Tag 2', slug: 'tag-2', postCount: 5 },
                ],
                total: 2,
            },
        }
        mockFetchPending.value = false
        mockFetchError.value = null
    })

    it('renders page header correctly', async () => {
        const wrapper = await mountSuspended(TagsIndexPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.tags-index__header').exists()).toBe(true)
        expect(wrapper.find('.tags-index__title').exists()).toBe(true)
    })

    it('shows subtitle with total count', async () => {
        const wrapper = await mountSuspended(TagsIndexPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.tags-index__subtitle').exists()).toBe(true)
    })

    it('shows skeleton list when pending', async () => {
        // Set pending state
        mockFetchPending.value = true

        const wrapper = await mountSuspended(TagsIndexPage, {
            global: {
                stubs,
            },
        })

        // When pending is true, skeletons should be shown
        const skeletons = wrapper.findAll('.tags-index__skeleton')
        expect(skeletons.length).toBe(20)
    })

    it('shows error state when there is an error', async () => {
        // Set error state
        mockFetchError.value = { message: 'Error message' }

        const wrapper = await mountSuspended(TagsIndexPage, {
            global: {
                stubs,
            },
        })

        // Error state div should exist in template
        expect(wrapper.find('.tags-index__error').exists()).toBe(true)
        expect(wrapper.find('.tags-index__error').text()).toContain('Error message')
    })

    it('renders tag cloud', async () => {
        const wrapper = await mountSuspended(TagsIndexPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.tags-index__cloud').exists()).toBe(true)
        expect(wrapper.findAll('.tag-cloud-item').length).toBe(2)
    })

    it('has correct CSS class structure', async () => {
        const wrapper = await mountSuspended(TagsIndexPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.tags-index').exists()).toBe(true)
        expect(wrapper.find('.tags-index__header').exists()).toBe(true)
        expect(wrapper.find('.tags-index__cloud').exists()).toBe(true)
    })

    it('renders tag cloud item with correct structure', async () => {
        const wrapper = await mountSuspended(TagsIndexPage, {
            global: {
                stubs,
            },
        })

        // Tag cloud item should have inner structure
        const html = wrapper.html()
        expect(html).toContain('tag-cloud-item')
    })
})

