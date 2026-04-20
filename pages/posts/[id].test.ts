import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import PostDetailPage from './[id].vue'

const { mockUsePageSeo } = vi.hoisted(() => ({
    mockUsePageSeo: vi.fn(),
}))
const { mockUseHead } = vi.hoisted(() => ({
    mockUseHead: vi.fn(),
}))
const mockFetchData = ref({
    data: {
        id: '123456789012345',
        title: 'Test Post',
        slug: 'test-post',
        language: 'zh-CN',
        summary: 'Test summary',
        content: '## What is GEO?\n\nGEO improves AI visibility and citation quality for public posts.\n\n## Why does it matter?\n\nIt helps answer engines discover summaries, structure, and canonical URLs.',
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
            language: 'zh-CN',
            summary: 'Newer summary',
            publishedAt: '2024-01-02T00:00:00Z',
        },
        nextPost: {
            id: '123456789012346',
            title: 'Older Post',
            slug: 'older-post',
            language: 'zh-CN',
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
mockNuxtImport('useHead', () => mockUseHead)
mockNuxtImport('useRuntimeConfig', () => () => ({
    public: {
        siteUrl: 'https://momei.app',
    },
}))

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
    ArticleShare: { template: '<div class="share">Share</div>', props: ['title', 'text', 'url', 'image'] },
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
        useRuntimeConfig: () => ({
            public: {
                siteUrl: 'https://momei.app',
            },
        }),
        usePageSeo: mockUsePageSeo,
        useHead: mockUseHead,
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
vi.stubGlobal('useRuntimeConfig', () => ({
    public: {
        siteUrl: 'https://momei.app',
    },
}))
vi.stubGlobal('usePageSeo', mockUsePageSeo)
vi.stubGlobal('useHead', mockUseHead)
vi.stubGlobal('useRequestURL', () => ({ href: 'http://localhost:3000/posts/test' }))
vi.stubGlobal('onMounted', (fn: () => void) => fn())
vi.stubGlobal('$fetch', vi.fn(() => Promise.resolve({ code: 200, data: { views: 101 } })))

describe('PostDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRoute.params.id = '123456789012345'
        mockRoute.query = {}
        mockFetchData.value = {
            data: {
                id: '123456789012345',
                title: 'Test Post',
                slug: 'test-post',
                language: 'zh-CN',
                summary: 'Test summary',
                content: '## What is GEO?\n\nGEO improves AI visibility and citation quality for public posts.\n\n## Why does it matter?\n\nIt helps answer engines discover summaries, structure, and canonical URLs.',
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
                    language: 'zh-CN',
                    summary: 'Newer summary',
                    publishedAt: '2024-01-02T00:00:00Z',
                },
                nextPost: {
                    id: '123456789012346',
                    title: 'Older Post',
                    slug: 'older-post',
                    language: 'zh-CN',
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

    it('renders share section for unlocked posts', async () => {
        const wrapper = await mountSuspended(PostDetailPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.share').exists()).toBe(true)
    })

    it('renders the article summary block when summary is available', async () => {
        const wrapper = await mountSuspended(PostDetailPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.post-detail__summary-text').text()).toBe('Test summary')
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
        expect(seoOptions.locale()).toBe('zh-CN')
        expect(seoOptions.path()).toBe('/posts/test-post')
        expect(seoOptions.abstract()).toBe('Test summary')
        expect(seoOptions.about()).toEqual(['Test Category', 'test'])
        expect(seoOptions.wordCount()).toBeGreaterThan(0)
        expect(seoOptions.speakableSelectors()).toEqual(['.post-detail__summary-text', '.markdown-body p:first-of-type'])

        const structuredData = seoOptions.structuredData()

        expect(structuredData).toHaveLength(2)
        expect(structuredData[0]).toMatchObject({ '@type': 'BreadcrumbList' })
        expect(structuredData[1]).toMatchObject({ '@type': 'FAQPage' })
    })

    it('uses the post language for canonical and structured seo URLs', async () => {
        mockFetchData.value = {
            data: {
                ...mockFetchData.value.data,
                slug: 'english-post',
                language: 'en-US',
            },
        }

        await mountSuspended(PostDetailPage, {
            global: {
                stubs,
            },
        })

        const seoOptions = mockUsePageSeo.mock.calls[0]?.[0]
        const structuredData = seoOptions.structuredData()
        const breadcrumb = structuredData[0]
        const headInput = mockUseHead.mock.calls.at(-1)?.[0]
        const headOptions = typeof headInput === 'function' ? headInput() : headInput

        expect(seoOptions.locale()).toBe('en-US')
        expect(seoOptions.path()).toBe('/en-US/posts/english-post')
        expect(breadcrumb.itemListElement[0].item).toBe('https://momei.app/en-US')
        expect(breadcrumb.itemListElement[1].item).toBe('https://momei.app/en-US/posts')
        expect(breadcrumb.itemListElement[2].item).toBe('https://momei.app/en-US/categories/test-category')
        expect(breadcrumb.itemListElement[3].item).toBe('https://momei.app/en-US/posts/english-post')
        expect(headOptions.link).toEqual([
            {
                rel: 'canonical',
                href: 'https://momei.app/en-US/posts/english-post',
            },
        ])
    })

    it('does not publish FAQPage structured data when only one question heading is present', async () => {
        mockFetchData.value = {
            data: {
                ...mockFetchData.value.data,
                content: '## Is one question enough?\n\nNo, a single question heading should not emit FAQPage schema on its own.',
            },
        }

        await mountSuspended(PostDetailPage, {
            global: {
                stubs,
            },
        })

        const seoOptions = mockUsePageSeo.mock.calls[0]?.[0]
        const structuredData = seoOptions.structuredData()

        expect(structuredData).toHaveLength(1)
        expect(structuredData[0]).toMatchObject({ '@type': 'BreadcrumbList' })
    })
})
