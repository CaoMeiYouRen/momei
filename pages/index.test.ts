import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import IndexPage from './index.vue'
import { useAppFetch } from '@/composables/use-app-fetch'

// Mock dependencies
vi.mock('@/composables/use-app-fetch', () => ({
    useAppFetch: vi.fn(),
}))

const mockLatestPostsData = {
    data: {
        items: [
            { id: 1, title: 'Pinned Post', slug: 'pinned-post', summary: 'Pinned summary', createdAt: '2024-01-01', updatedAt: '2024-01-01', status: 'published', isPinned: true },
        ],
    },
}

const mockRegularLatestPostsData = {
    data: {
        items: [
            { id: 2, title: 'Post 2', slug: 'post-2', summary: 'Summary 2', createdAt: '2024-01-02', updatedAt: '2024-01-02', status: 'published' },
            { id: 3, title: 'Post 3', slug: 'post-3', summary: 'Summary 3', createdAt: '2024-01-03', updatedAt: '2024-01-03', status: 'published' },
        ],
    },
}

const mockPopularPostsData = {
    data: {
        items: [
            { id: 1, title: 'Pinned Post', slug: 'pinned-post', summary: 'Pinned summary', createdAt: '2024-01-01', updatedAt: '2024-01-01', status: 'published' },
            { id: 4, title: 'Post 4', slug: 'post-4', summary: 'Summary 4', createdAt: '2024-01-04', updatedAt: '2024-01-04', status: 'published' },
        ],
    },
}

describe('IndexPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useAppFetch).mockReset()
        vi.mocked(useAppFetch)
            .mockReturnValueOnce({
                data: ref(mockLatestPostsData),
                pending: ref(false),
                error: ref(null),
            } as any)
            .mockReturnValueOnce({
                data: ref(mockRegularLatestPostsData),
                pending: ref(false),
                error: ref(null),
            } as any)
            .mockReturnValueOnce({
                data: ref(mockPopularPostsData),
                pending: ref(false),
                error: ref(null),
            } as any)
    })

    it('renders latest section with one pinned post and fills the remaining slots with non-pinned latest posts', async () => {
        const wrapper = await mountSuspended(IndexPage, {
            global: {
                stubs: {
                    ArticleCard: { template: '<div class="article-card">{{ post.title }}</div>', props: ['post'] },
                    SubscriberForm: { template: '<div />' },
                    Skeleton: { template: '<div />' },
                },
            },
        })

        expect(vi.mocked(useAppFetch)).toHaveBeenCalledTimes(3)
        expect(wrapper.findAll('.article-card').length).toBe(4)
        expect(wrapper.text()).toContain('Pinned Post')
        expect(wrapper.text()).toContain('Post 2')
        expect(wrapper.text()).toContain('Post 3')
        expect(wrapper.text()).toContain('Post 4')
    })

    it('shows loading state', async () => {
        vi.mocked(useAppFetch).mockReset()
        vi.mocked(useAppFetch)
            .mockReturnValueOnce({
                data: ref(null),
                pending: ref(true),
                error: ref(null),
            } as any)
            .mockReturnValueOnce({
                data: ref(null),
                pending: ref(true),
                error: ref(null),
            } as any)
            .mockReturnValueOnce({
                data: ref(null),
                pending: ref(true),
                error: ref(null),
            } as any)

        const wrapper = await mountSuspended(IndexPage, {
            global: {
                stubs: {
                    Skeleton: { template: '<div class="skeleton" />' },
                },
            },
        })
        expect(wrapper.findAll('.skeleton').length).toBeGreaterThan(0)
    })

    it('shows error state', async () => {
        vi.mocked(useAppFetch).mockReset()
        vi.mocked(useAppFetch)
            .mockReturnValueOnce({
                data: ref(null),
                pending: ref(false),
                error: ref(new Error('Failed')),
            } as any)
            .mockReturnValueOnce({
                data: ref(null),
                pending: ref(false),
                error: ref(null),
            } as any)
            .mockReturnValueOnce({
                data: ref(null),
                pending: ref(false),
                error: ref(null),
            } as any)

        const wrapper = await mountSuspended(IndexPage)
        const text = wrapper.text()
        expect(text.includes('common.error_loading') || text.includes('加载失败')).toBe(true)
    })
})
