import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import IndexPage from './index.vue'
import { useAppFetch } from '@/composables/use-app-fetch'

vi.mock('#app', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#app')>()

    return {
        ...actual,
        useRuntimeConfig: () => ({
            public: {
                windowsLocalDevMode: false,
            },
        }),
    }
})

// Mock dependencies
vi.mock('@/composables/use-app-fetch', () => ({
    useAppFetch: vi.fn(),
}))

const mockHomePostsData = {
    data: {
        items: [
            { id: 1, title: 'Pinned Post', slug: 'pinned-post', summary: 'Pinned summary', createdAt: '2024-01-01', updatedAt: '2024-01-01', status: 'published', isPinned: true },
            { id: 2, title: 'Post 2', slug: 'post-2', summary: 'Summary 2', createdAt: '2024-01-02', updatedAt: '2024-01-02', status: 'published' },
            { id: 3, title: 'Post 3', slug: 'post-3', summary: 'Summary 3', createdAt: '2024-01-03', updatedAt: '2024-01-03', status: 'published' },
        ],
        popular: [
            { id: 4, title: 'Post 4', slug: 'post-4', summary: 'Summary 4', createdAt: '2024-01-04', updatedAt: '2024-01-04', status: 'published' },
            { id: 5, title: 'Post 5', slug: 'post-5', summary: 'Summary 5', createdAt: '2024-01-05', updatedAt: '2024-01-05', status: 'published' },
        ],
        hot: [
            { id: 6, title: 'Hot Post', slug: 'hot-post', summary: 'Hot summary', createdAt: '2024-01-06', updatedAt: '2024-01-06', status: 'published' },
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
                data: ref(mockHomePostsData),
                pending: ref(false),
                error: ref(null),
            } as any)
            .mockReturnValueOnce({
                data: ref(mockExternalFeedData),
                pending: ref(false),
                error: ref(null),
            } as any)
    })

    it('renders all sections from unified home endpoint', async () => {
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

        // 现在只有 2 次 useAppFetch 调用（home + external），不再有独立 popular/hot 请求
        expect(vi.mocked(useAppFetch)).toHaveBeenCalledTimes(2)
        expect(wrapper.findAll('.article-card').length).toBe(6)
        expect(wrapper.text()).toContain('Pinned Post')
        expect(wrapper.text()).toContain('Post 2')
        expect(wrapper.text()).toContain('Post 3')
        expect(wrapper.text()).toContain('Post 4')
        expect(wrapper.text()).toContain('Post 5')
        expect(wrapper.text()).toContain('Hot Post')
        expect(wrapper.text()).toContain('External Feed Item')
        expect(wrapper.text()).toContain('External Source')

        const homeCall = vi.mocked(useAppFetch).mock.calls[0]
        expect(homeCall?.[0]).toBe('/api/posts/home')
        expect(homeCall?.[1]).toBeUndefined()

        const externalCall = vi.mocked(useAppFetch).mock.calls[1]
        expect(externalCall?.[0]).toBe('/api/external-feed/home')
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
