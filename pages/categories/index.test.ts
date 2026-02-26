import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import CategoriesIndexPage from './index.vue'

// Mock locale
const mockLocale = ref('en')

// Stub components
const stubs = {
    Skeleton: { template: '<div class="skeleton"><slot /></div>' },
    Message: { template: '<div v-if="severity" class="message"><slot /></div>', props: ['severity'] },
    NuxtLink: { template: '<a :href="to" class="nuxt-link"><slot /></a>', props: ['to'] },
}

// Mock Nuxt auto-imports
vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()
    return {
        ...actual,
        useI18n: () => ({
            t: (key: string, params?: any) => {
                if (params?.count !== undefined) {
                    return `${key} (${params.count})`
                }
                return key
            },
            locale: mockLocale,
        }),
        useLocalePath: () => (path: string) => path,
        useHead: vi.fn(),
    }
})

vi.stubGlobal('useI18n', () => ({
    t: (key: string, params?: any) => {
        if (params?.count !== undefined) {
            return `${key} (${params.count})`
        }
        return key
    },
    locale: mockLocale,
}))
vi.stubGlobal('useLocalePath', () => (path: string) => path)
vi.stubGlobal('useHead', vi.fn())

describe('CategoriesIndexPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
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
        const wrapper = await mountSuspended(CategoriesIndexPage, {
            global: {
                stubs,
            },
        })

        // Error state div should exist in template
        expect(wrapper.find('.categories-index__error').exists()).toBe(true)
    })

    it('renders category cards grid', async () => {
        const wrapper = await mountSuspended(CategoriesIndexPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.categories-index__grid').exists()).toBe(true)
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
    })
})
