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
            { id: 2, title: 'Post 2', slug: 'post-2', summary: 'Summary 2', createdAt: '2024-01-02', updatedAt: '2024-01-02', status: 'published' },
            { id: 3, title: 'Post 3', slug: 'post-3', summary: 'Summary 3', createdAt: '2024-01-03', updatedAt: '2024-01-03', status: 'published' },
        ],
    },
}

const mockPopularPostsData = {
    data: {
        items: [
            { id: 4, title: 'Post 4', slug: 'post-4', summary: 'Summary 4', createdAt: '2024-01-04', updatedAt: '2024-01-04', status: 'published' },
            { id: 5, title: 'Post 5', slug: 'post-5', summary: 'Summary 5', createdAt: '2024-01-05', updatedAt: '2024-01-05', status: 'published' },
        ],
    },
}

const mockExternalFeedData = {
    data: {
        items: [
            {
                id: 'external-1',
                sourceId: 'source-1',
                title: 'External Feed Item',
                summary: 'External summary',
                url: 'https://example.com/external-1',
                canonicalUrl: 'https://example.com/external-1',
                publishedAt: '2026-04-03T10:00:00.000Z',
                authorName: 'External Author',
                language: 'zh-CN',
                coverImage: null,
                sourceTitle: 'External Source',
                sourceSiteUrl: 'https://example.com',
                sourceBadge: 'RSS',
                dedupeKey: 'https://example.com/external-1',
                priority: 10,
            },
        ],
        degraded: false,
        stale: false,
        fetchedAt: '2026-04-03T10:00:00.000Z',
        sourceCount: 1,
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
            .mockReturnValueOnce({
                data: ref(mockExternalFeedData),
                pending: ref(false),
                error: ref(null),
            } as any)
    })

    it('renders latest section with one pinned post and keeps popular posts free of pinned content', async () => {
        const wrapper = await mountSuspended(IndexPage, {
            global: {
                stubs: {
                    ArticleCard: { template: '<div class="article-card">{{ post.title }}</div>', props: ['post'] },
                    LazySubscriberForm: { template: '<div />' },
                    LazyHomeExternalFeedPanel: { template: '<div>{{ items[0]?.title }} {{ items[0]?.sourceTitle }}</div>', props: ['items'] },
                    Skeleton: { template: '<div />' },
                    Tag: { template: '<div><slot />{{ value }}</div>', props: ['value'] },
                    Message: { template: '<div><slot /></div>' },
                },
            },
        })

        expect(vi.mocked(useAppFetch)).toHaveBeenCalledTimes(3)
        expect(wrapper.findAll('.article-card').length).toBe(5)
        expect(wrapper.text()).toContain('Pinned Post')
        expect(wrapper.text()).toContain('Post 2')
        expect(wrapper.text()).toContain('Post 3')
        expect(wrapper.text()).toContain('Post 4')
        expect(wrapper.text()).toContain('Post 5')
        expect(wrapper.text()).toContain('External Feed Item')
        expect(wrapper.text()).toContain('External Source')

        const latestCall = vi.mocked(useAppFetch).mock.calls[0]
        expect(latestCall?.[0]).toBe('/api/posts/home')

        const popularCall = vi.mocked(useAppFetch).mock.calls[1]
        expect(popularCall?.[1]).toMatchObject({
            query: expect.objectContaining({
                isPinned: false,
                orderBy: 'views',
                order: 'DESC',
            }),
        })
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
                    LazyHomeExternalFeedPanel: { template: '<div />' },
                    LazySubscriberForm: { template: '<div />' },
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

        const wrapper = await mountSuspended(IndexPage, {
            global: {
                stubs: {
                    LazyHomeExternalFeedPanel: { template: '<div />' },
                    LazySubscriberForm: { template: '<div />' },
                },
            },
        })
        const text = wrapper.text()
        expect(text.includes('common.error_loading') || text.includes('加载失败')).toBe(true)
    })
})
