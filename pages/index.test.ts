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
            { id: 1, title: 'Post 1', slug: 'post-1', summary: 'Summary 1', createdAt: '2024-01-01', updatedAt: '2024-01-01', status: 'published' },
            { id: 2, title: 'Post 2', slug: 'post-2', summary: 'Summary 2', createdAt: '2024-01-02', updatedAt: '2024-01-02', status: 'published' },
        ],
    },
}

const mockPopularPostsData = {
    data: {
        items: [
            { id: 1, title: 'Post 1', slug: 'post-1', summary: 'Summary 1', createdAt: '2024-01-01', updatedAt: '2024-01-01', status: 'published' },
            { id: 3, title: 'Post 3', slug: 'post-3', summary: 'Summary 3', createdAt: '2024-01-03', updatedAt: '2024-01-03', status: 'published' },
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
                data: ref(mockPopularPostsData),
                pending: ref(false),
                error: ref(null),
            } as any)
    })

    it('renders latest and popular posts without duplicates', async () => {
        const wrapper = await mountSuspended(IndexPage, {
            global: {
                stubs: {
                    ArticleCard: { template: '<div class="article-card">{{ post.title }}</div>', props: ['post'] },
                    SubscriberForm: { template: '<div />' },
                    Skeleton: { template: '<div />' },
                },
            },
        })

        expect(wrapper.findAll('.article-card').length).toBe(3)
        expect(wrapper.text()).toContain('Post 1')
        expect(wrapper.text()).toContain('Post 2')
        expect(wrapper.text()).toContain('Post 3')
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

        const wrapper = await mountSuspended(IndexPage)
        const text = wrapper.text()
        expect(text.includes('common.error_loading') || text.includes('加载失败')).toBe(true)
    })
})
