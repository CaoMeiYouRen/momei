import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick, ref } from 'vue'
import ArchivesIndex from './index.vue'
import { useAppFetch } from '@/composables/use-app-fetch'

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
