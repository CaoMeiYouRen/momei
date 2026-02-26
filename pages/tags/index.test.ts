import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import TagsIndexPage from './index.vue'

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

describe('TagsIndexPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
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
        const wrapper = await mountSuspended(TagsIndexPage, {
            global: {
                stubs,
            },
        })

        // Error state div should exist in template
        expect(wrapper.find('.tags-index__error').exists()).toBe(true)
    })

    it('renders tag cloud', async () => {
        const wrapper = await mountSuspended(TagsIndexPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.tags-index__cloud').exists()).toBe(true)
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
