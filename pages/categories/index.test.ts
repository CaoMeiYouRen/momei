import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import CategoriesIndexPage from './index.vue'

// Mock locale
const mockLocale = ref('en')

// Control useAppFetch state
const mockFetchData = ref<any>({
    data: {
        items: [
            { id: '1', name: 'Category 1', slug: 'category-1', postCount: 10 },
            { id: '2', name: 'Category 2', slug: 'category-2', postCount: 5 },
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

describe('CategoriesIndexPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset fetch state
        mockFetchData.value = {
            data: {
                items: [
                    { id: '1', name: 'Category 1', slug: 'category-1', postCount: 10 },
                    { id: '2', name: 'Category 2', slug: 'category-2', postCount: 5 },
                ],
                total: 2,
            },
        }
        mockFetchPending.value = false
        mockFetchError.value = null
    })

    it('renders page header correctly', async () => {
        const wrapper = await mountSuspended(CategoriesIndexPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.categories-index__header').exists()).toBe(true)
        expect(wrapper.find('.categories-index__title').exists()).toBe(true)
    })

    it('shows subtitle with total count', async () => {
        const wrapper = await mountSuspended(CategoriesIndexPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.categories-index__subtitle').exists()).toBe(true)
    })

    it('shows skeleton when pending', async () => {
        // Set pending state
        mockFetchPending.value = true

        const wrapper = await mountSuspended(CategoriesIndexPage, {
            global: {
                stubs,
            },
        })

        // When pending is true, skeletons should be shown
        const skeletons = wrapper.findAll('.categories-index__skeleton')
        expect(skeletons.length).toBe(6)
    })

    it('shows error state when there is an error', async () => {
        // Set error state
        mockFetchError.value = { message: 'Error message' }

        const wrapper = await mountSuspended(CategoriesIndexPage, {
            global: {
                stubs,
            },
        })

        // Error state div should exist in template
        expect(wrapper.find('.categories-index__error').exists()).toBe(true)
        expect(wrapper.find('.categories-index__error').text()).toContain('Error message')
    })

    it('renders category cards grid', async () => {
        const wrapper = await mountSuspended(CategoriesIndexPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.categories-index__grid').exists()).toBe(true)
        expect(wrapper.findAll('.category-card').length).toBe(2)
    })

    it('has correct CSS class structure', async () => {
        const wrapper = await mountSuspended(CategoriesIndexPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.categories-index').exists()).toBe(true)
        expect(wrapper.find('.categories-index__header').exists()).toBe(true)
        expect(wrapper.find('.categories-index__grid').exists()).toBe(true)
    })

    it('renders category card with correct structure', async () => {
        const wrapper = await mountSuspended(CategoriesIndexPage, {
            global: {
                stubs,
            },
        })

        // Category card should have content and footer sections
        const html = wrapper.html()
        expect(html).toContain('category-card')
        expect(wrapper.find('.category-card__content').exists()).toBe(true)
        expect(wrapper.find('.category-card__footer').exists()).toBe(true)
    })
})

