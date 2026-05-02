import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { nextTick, ref } from 'vue'
import ArchivesIndex from './index.vue'
import { useAppFetch } from '@/composables/use-app-fetch'

const showSummaryState = ref(false)
const mockUsePageSeo = vi.fn((config?: { title?: () => string, description?: () => string }) => {
    config?.title?.()
    config?.description?.()
})

const translate = (key: string, params?: { count?: number }) => {
    switch (key) {
        case 'pages.archives.title':
            return 'Archives'
        case 'pages.archives.count':
            return `${params?.count ?? 0} posts`
        case 'pages.archives.months.4':
            return 'April'
        case 'pages.archives.months.5':
            return 'May'
        case 'pages.archives.months.12':
            return 'December'
        case 'common.error_loading':
            return 'Failed to load archives'
        default:
            return key
    }
}

mockNuxtImport('useI18n', () => () => ({
    t: translate,
    locale: ref('en'),
}))

mockNuxtImport('useLocalePath', () => () => (path: string) => path)
mockNuxtImport('usePageSeo', () => (...args: Parameters<typeof mockUsePageSeo>) => mockUsePageSeo(...args))
mockNuxtImport('useState', () => () => showSummaryState)

// Mock dependencies
vi.mock('@/composables/use-app-fetch', () => ({
    useAppFetch: vi.fn(),
}))

// Mock global $fetch
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

const mockArchiveData = {
    data: [
        {
            year: 2024,
            months: [
                { month: 5, count: 2 },
                { month: 4, count: 1 },
            ],
        },
        {
            year: 2023,
            months: [
                { month: 12, count: 5 },
            ],
        },
    ],
}

const mockPostsData = {
    data: {
        items: [
            { id: 1, title: 'Post 1', slug: 'post-1', summary: 'Summary 1' },
            { id: 2, title: 'Post 2', slug: 'post-2', summary: 'Summary 2' },
        ],
    },
}

describe('ArchivesIndex', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        showSummaryState.value = false
        mockUsePageSeo.mockClear()
        vi.mocked(useAppFetch).mockReturnValue({
            data: ref(mockArchiveData),
            pending: ref(false),
            error: ref(null),
        } as any)

        mockFetch.mockResolvedValue(mockPostsData)
    })

    it('renders the archive list grouped by year', async () => {
        const wrapper = await mountSuspended(ArchivesIndex)

        expect(wrapper.find('.year-title').exists()).toBe(true)
        expect(wrapper.findAll('.year-block').length).toBe(2)
        expect(wrapper.text()).toMatch(/May|5月|五月/u)
        expect(wrapper.text()).toMatch(/2 posts|共计 2 篇/u)
        expect(wrapper.text()).not.toContain('pages.archives.months.5')
        expect(wrapper.text()).not.toContain('pages.archives.count')
        expect(mockUsePageSeo).toHaveBeenCalled()
    })

    it('expands the first year months by default', async () => {
        const wrapper = await mountSuspended(ArchivesIndex)

        // Wait for watchers and async calls
        await nextTick()
        await nextTick()

        // Check if $fetch was called for the first month of the first year
        expect(mockFetch).toHaveBeenCalledWith('/api/posts/archive', expect.objectContaining({
            query: expect.objectContaining({ year: 2024, month: 5 }),
        }))

        // Posts should be rendered for the expanded month
        expect(wrapper.findAll('.post-item').length).toBeGreaterThan(0)
        expect(wrapper.text()).toContain('Post 1')
    })

    it('toggles a month to show/hide posts', async () => {
        const wrapper = await mountSuspended(ArchivesIndex)
        await nextTick()
        await nextTick()

        // Find the toggle for 2023-12 (it should be in the second year block)
        const toggles = wrapper.findAll('.month-toggle')
        const dec2023Toggle = toggles.find((t) => t.text().includes('12'))

        if (dec2023Toggle) {
            await dec2023Toggle.trigger('click')
            await nextTick()
            await nextTick()

            expect(mockFetch).toHaveBeenCalledWith('/api/posts/archive', expect.objectContaining({
                query: expect.objectContaining({ year: 2023, month: 12 }),
            }))
        }
    })

    it('renders post summaries when the summary state is enabled', async () => {
        showSummaryState.value = true

        const wrapper = await mountSuspended(ArchivesIndex)
        await nextTick()
        await nextTick()

        expect(wrapper.find('.post-summary').exists()).toBe(true)
        expect(wrapper.text()).toContain('Summary 1')
    })

    it('collapses an expanded month without refetching posts', async () => {
        const wrapper = await mountSuspended(ArchivesIndex)
        await nextTick()
        await nextTick()

        const toggles = wrapper.findAll('.month-toggle')
        const initialFetchCount = mockFetch.mock.calls.length

        await toggles[0]?.trigger('click')
        await nextTick()

        expect(mockFetch).toHaveBeenCalledTimes(initialFetchCount)
        expect(toggles[0]?.attributes('aria-expanded')).toBe('false')
    })

    it('falls back to an empty post list when loading a month fails', async () => {
        mockFetch.mockImplementation((_path: string, options?: { query?: { year?: number, month?: number } }) => {
            if (options?.query?.year === 2023 && options.query.month === 12) {
                return Promise.reject(new Error('month failed'))
            }

            return Promise.resolve(mockPostsData)
        })

        const wrapper = await mountSuspended(ArchivesIndex)
        await nextTick()
        await nextTick()

        const toggles = wrapper.findAll('.month-toggle')
        const dec2023Toggle = toggles.find((toggle) => /December|12/u.test(toggle.text()))
        const dec2023MonthItem = wrapper.findAll('.month-item').find((item) => /December|12/u.test(item.text()))
        const initialPostCount = wrapper.findAll('.post-item').length

        await dec2023Toggle?.trigger('click')
        await nextTick()
        await nextTick()

        expect(mockFetch).toHaveBeenCalledWith('/api/posts/archive', expect.objectContaining({
            query: expect.objectContaining({ year: 2023, month: 12 }),
        }))
        expect(initialPostCount).toBeGreaterThan(0)
        expect(wrapper.findAll('.post-item')).toHaveLength(initialPostCount)
        expect(dec2023MonthItem?.findAll('.post-item')).toHaveLength(0)
        expect(wrapper.find('.error-state').exists()).toBe(false)
    })

    it('shows loading state', async () => {
        vi.mocked(useAppFetch).mockReturnValue({
            data: ref(null),
            pending: ref(true),
            error: ref(null),
        } as any)

        const wrapper = await mountSuspended(ArchivesIndex)
        expect(wrapper.find('.loading').exists()).toBe(true)
    })

    it('shows error state', async () => {
        vi.mocked(useAppFetch).mockReturnValue({
            data: ref(null),
            pending: ref(false),
            error: ref(new Error('Failed')),
        } as any)

        const wrapper = await mountSuspended(ArchivesIndex)
        expect(wrapper.find('.error-state').exists()).toBe(true)
    })
})
