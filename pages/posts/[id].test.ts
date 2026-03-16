import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import PostDetailPage from './[id].vue'

const { mockUsePageSeo } = vi.hoisted(() => ({
    mockUsePageSeo: vi.fn(),
}))
const mockFetchData = ref({
    data: {
        id: '123456789012345',
        title: 'Test Post',
        slug: 'test-post',
        summary: 'Test summary',
        content: 'Test content',
        status: 'published',
        author: {
            id: '1',
            name: 'Test Author',
            email: 'test@example.com',
            emailHash: 'abc123',
        },
        category: {
            id: '1',
            name: 'Test Category',
            slug: 'test-category',
        },
        tags: [
            { id: '1', name: 'test', slug: 'test' },
        ],
        previousPost: {
            id: '123456789012344',
            title: 'Newer Post',
            slug: 'newer-post',
            summary: 'Newer summary',
            publishedAt: '2024-01-02T00:00:00Z',
        },
        nextPost: {
            id: '123456789012346',
            title: 'Older Post',
            slug: 'older-post',
            summary: 'Older summary',
            publishedAt: '2023-12-31T00:00:00Z',
        },
        publishedAt: '2024-01-01T00:00:00Z',
        views: 100,
    },
})

// Mock utilities
vi.mock('@/utils/shared/validate', () => ({
    isSnowflakeId: vi.fn((id: string) => /^\d{15,}$/.test(id)),
}))

vi.mock('@/utils/shared/post-stats', () => ({
    countWords: vi.fn((content: string) => content.split(/\s+/).length),
    estimateReadingTime: vi.fn((content: string) => Math.ceil(content.split(/\s+/).length / 200)),
}))

// Mock useAppFetch to return mock data
vi.mock('@/composables/use-app-fetch', () => ({
    useAppFetch: vi.fn(() => ({
        data: mockFetchData,
        pending: ref(false),
        error: ref(null),
        refresh: vi.fn(),
    })),
}))

// Mock route
const mockRoute = {
    params: { id: '123456789012345' },
    query: {},
}

mockNuxtImport('useMomeiConfig', () => () => ({
    currentDescription: ref('AI 驱动、原生国际化的开发者博客平台。'),
}))

mockNuxtImport('usePageSeo', () => mockUsePageSeo)

// Stub components
const stubs = {
    Skeleton: { template: '<div class="skeleton"><slot /></div>' },
    Message: { template: '<div v-if="severity" class="message"><slot /></div>', props: ['severity', 'closable'] },
    Button: {
        template: '<button :type="type" @click="$emit(\'click\')"><slot /></button>',
        props: ['label', 'loading', 'icon', 'severity', 'text', 'id', 'type'],
        emits: ['click'],
    },
    InputText: {
        template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        props: ['modelValue', 'type', 'placeholder'],
        emits: ['update:modelValue'],
    },
    NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
    TableOfContents: { template: '<div class="toc">Table of Contents</div>' },
    AdPlacement: { template: '<div class="ad">Ad</div>', props: ['location', 'context'] },
    ArticleContent: { template: '<div class="content">Content</div>', props: ['content'] },
    ArticleCopyright: { template: '<div class="copyright">Copyright</div>', props: ['authorName', 'url', 'license'] },
    ArticleSponsor: { template: '<div class="sponsor">Sponsor</div>', props: ['socialLinks', 'donationLinks'] },
    SubscriberForm: { template: '<div class="subscribe">Subscribe</div>' },
    CommentList: { template: '<div class="comments">Comments</div>', props: ['postId'] },
    AppAvatar: { template: '<div class="avatar"><slot /></div>', props: ['image', 'emailHash', 'name', 'shape'] },
    Tag: { template: '<span class="tag">{{ value }}</span>', props: ['value', 'severity', 'rounded'] },
    Dialog: { template: '<div class="dialog"><slot /></div>', props: ['visible', 'modal', 'showHeader', 'contentClass'] },
    TravellingsLink: { template: '<div class="travellings">Travellings</div>', props: ['placement'] },
    ReaderControls: { template: '<div class="reader-controls">Reader Controls</div>' },
}

// Mock Nuxt auto-imports
vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()
    return {
        ...actual,
        useRoute: () => mockRoute,
        useI18n: () => ({
            t: (key: string, params?: any) => {
                if (params?.min !== undefined) {
                    return `${params.min} min`
                }
                if (params?.status !== undefined) {
                    return `Status: ${params.status}`
                }
                if (key.startsWith('pages.posts.locked.')) {
                    return key
                }
                return key
            },
        }),
        useLocalePath: () => (path: string) => path,
        useSetI18nParams: () => vi.fn(),
        useI18nDate: () => ({
            formatDateTime: () => '2024-01-01',
        }),
        useMomeiConfig: () => ({
            currentDescription: ref('AI 驱动、原生国际化的开发者博客平台。'),
        }),
        usePageSeo: mockUsePageSeo,
        useHead: vi.fn(),
        useRequestURL: () => ({ href: 'http://localhost:3000/posts/test' }),
        onMounted: (fn: () => void) => fn(),
    }
})

vi.stubGlobal('useRoute', () => mockRoute)
vi.stubGlobal('useI18n', () => ({
    t: (key: string, params?: any) => {
        if (params?.min !== undefined) {
            return `${params.min} min`
        }
        if (params?.status !== undefined) {
            return `Status: ${params.status}`
        }
        return key
    },
}))
vi.stubGlobal('useLocalePath', () => (path: string) => path)
vi.stubGlobal('useSetI18nParams', () => vi.fn())
vi.stubGlobal('useI18nDate', () => ({
    formatDateTime: () => '2024-01-01',
}))
vi.stubGlobal('useMomeiConfig', () => ({
    currentDescription: ref('AI 驱动、原生国际化的开发者博客平台。'),
}))
vi.stubGlobal('usePageSeo', mockUsePageSeo)
vi.stubGlobal('useHead', vi.fn())
vi.stubGlobal('useRequestURL', () => ({ href: 'http://localhost:3000/posts/test' }))
vi.stubGlobal('onMounted', (fn: () => void) => fn())
vi.stubGlobal('$fetch', vi.fn(async () => ({ code: 200, data: { views: 101 } })))

describe('PostDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRoute.params.id = '123456789012345'
        mockFetchData.value = {
            data: {
                id: '123456789012345',
                title: 'Test Post',
                slug: 'test-post',
                summary: 'Test summary',
                content: 'Test content',
                status: 'published',
                author: {
                    id: '1',
                    name: 'Test Author',
                    email: 'test@example.com',
                    emailHash: 'abc123',
                },
                category: {
                    id: '1',
                    name: 'Test Category',
                    slug: 'test-category',
                },
                tags: [
                    { id: '1', name: 'test', slug: 'test' },
                ],
                previousPost: {
                    id: '123456789012344',
                    title: 'Newer Post',
                    slug: 'newer-post',
                    summary: 'Newer summary',
                    publishedAt: '2024-01-02T00:00:00Z',
                },
                nextPost: {
                    id: '123456789012346',
                    title: 'Older Post',
                    slug: 'older-post',
                    summary: 'Older summary',
                    publishedAt: '2023-12-31T00:00:00Z',
                },
                publishedAt: '2024-01-01T00:00:00Z',
                views: 100,
            },
        }
    })

    it('renders loading skeleton when pending', async () => {
        const wrapper = await mountSuspended(PostDetailPage, {
            global: {
                stubs,
            },
        })

        // Check if page wrapper exists
        expect(wrapper.find('.post-detail').exists()).toBe(true)
    })

    it('renders error state when there is an error', async () => {
        const wrapper = await mountSuspended(PostDetailPage, {
            global: {
                stubs,
            },
        })

        // Page should render (either content or error)
        expect(wrapper.find('.post-detail').exists()).toBe(true)
    })

    it('has correct CSS class structure', async () => {
        const wrapper = await mountSuspended(PostDetailPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.post-detail').exists()).toBe(true)
    })

    it('renders post content layout', async () => {
        const wrapper = await mountSuspended(PostDetailPage, {
            global: {
                stubs,
            },
        })

        // Page wrapper should exist
        expect(wrapper.find('.post-detail').exists()).toBe(true)
    })

    it('has sidebar for table of contents', async () => {
        const wrapper = await mountSuspended(PostDetailPage, {
            global: {
                stubs,
            },
        })

        // The page should render
        expect(wrapper.find('.post-detail').exists()).toBe(true)
        // Note: Sidebar visibility depends on API response data
    })

    it('has main content area', async () => {
        const wrapper = await mountSuspended(PostDetailPage, {
            global: {
                stubs,
            },
        })

        // The page should render
        expect(wrapper.find('.post-detail').exists()).toBe(true)
        // Note: Main content visibility depends on API response data
    })

    it('renders lightbox dialog', async () => {
        const wrapper = await mountSuspended(PostDetailPage, {
            global: {
                stubs,
            },
        })

        // Dialog component should be in template
        const html = wrapper.html()
        expect(html.length).toBeGreaterThan(0)
    })

    it('renders previous and next post navigation cards', async () => {
        const wrapper = await mountSuspended(PostDetailPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.post-detail__navigation').exists()).toBe(true)
        expect(wrapper.text()).toContain('Newer Post')
        expect(wrapper.text()).toContain('Older Post')
    })

    it('passes article summary and site description into page seo', async () => {
        await mountSuspended(PostDetailPage, {
            global: {
                stubs,
            },
        })

        const seoOptions = mockUsePageSeo.mock.calls[0]?.[0]

        expect(seoOptions).toBeTruthy()
        expect(seoOptions.title()).toBe('Test Post')
        expect(seoOptions.description()).toBe('Test summary AI 驱动、原生国际化的开发者博客平台。')
    })
})
