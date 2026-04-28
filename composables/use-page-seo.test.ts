import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { buildCanonicalPageUrl, usePageSeo } from './use-page-seo'

const routeState = {
    fullPath: '/current/path?from=test#section',
}

const runtimeConfigState = {
    app: {
        baseURL: '/',
    },
    public: {
        siteUrl: 'https://momei.app/',
    },
}

const localeState = ref('zh-CN')
const currentTitle = ref('墨梅博客')
const currentDescription = ref('默认站点描述')
const siteLogo = ref('/logo.png')

const translations: Record<string, string> = {
    'app.name': 'Momei Blog',
    'app.description': 'Fallback description',
}

const { mockUseHead } = vi.hoisted(() => ({
    mockUseHead: vi.fn(),
}))

mockNuxtImport('useHead', () => mockUseHead)
mockNuxtImport('useRoute', () => () => routeState)
mockNuxtImport('useRouter', () => () => ({
    replace: vi.fn(() => Promise.resolve()),
    push: vi.fn(),
    currentRoute: ref({
        fullPath: routeState.fullPath,
        path: routeState.fullPath.split('?')[0]?.split('#')[0] || '/',
        params: {},
        meta: {},
    }),
    afterEach: vi.fn(),
    beforeEach: vi.fn(),
    beforeResolve: vi.fn(),
    onError: vi.fn(),
}))
mockNuxtImport('useRuntimeConfig', () => () => runtimeConfigState)
mockNuxtImport('useI18n', () => () => ({
    locale: localeState,
    t: (key: string) => translations[key] || key,
}))
mockNuxtImport('useMomeiConfig', () => () => ({
    currentTitle,
    currentDescription,
    siteLogo,
}))

function resolveHeadPayload() {
    const payload = mockUseHead.mock.calls.at(-1)?.[0]
    return typeof payload === 'function' ? payload() : payload
}

describe('usePageSeo', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        routeState.fullPath = '/current/path?from=test#section'
        runtimeConfigState.app.baseURL = '/'
        runtimeConfigState.public.siteUrl = 'https://momei.app/'
        localeState.value = 'zh-CN'
        currentTitle.value = '墨梅博客'
        currentDescription.value = '默认站点描述'
        siteLogo.value = '/logo.png'
    })

    it('normalizes the site root canonical url without a trailing slash', () => {
        expect(buildCanonicalPageUrl('https://momei.app/', '/')).toBe('https://momei.app')
        expect(buildCanonicalPageUrl('https://momei.app', '/')).toBe('https://momei.app')
    })

    it('keeps non-root paths as absolute urls', () => {
        expect(buildCanonicalPageUrl('https://momei.app/', '/posts/test-post')).toBe('https://momei.app/posts/test-post')
        expect(buildCanonicalPageUrl('https://momei.app', '/en-US')).toBe('https://momei.app/en-US')
    })

    it('builds website seo payload from route, config fallbacks and extra structured data', () => {
        const seo = usePageSeo({
            type: 'website',
            title: computed(() => '首页'),
            structuredData: [{ '@type': 'Thing', name: 'extra-node' }],
        })

        expect(seo.canonicalUrl.value).toBe('https://momei.app/current/path?from=test')
        expect(seo.imageUrl.value).toBe('https://momei.app/logo.png')
        expect(seo.shouldNoIndex.value).toBe(false)

        const head = resolveHeadPayload()
        expect(head.title).toBe('首页')
        expect(head.meta).toEqual(expect.arrayContaining([
            { name: 'description', content: '默认站点描述' },
            { name: 'robots', content: 'index, follow' },
            { property: 'og:title', content: '首页' },
            { property: 'og:url', content: 'https://momei.app/current/path?from=test' },
            { property: 'og:site_name', content: '墨梅博客' },
            { property: 'og:type', content: 'website' },
            { property: 'og:locale', content: 'zh_CN' },
            { property: 'og:image', content: 'https://momei.app/logo.png' },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:image', content: 'https://momei.app/logo.png' },
        ]))
        expect(head.meta).toContainEqual({ property: 'og:locale:alternate', content: 'en_US' })
        expect(head.meta).toContainEqual({ property: 'og:locale:alternate', content: 'ja_JP' })
        expect(head.script).toHaveLength(2)
        expect(JSON.parse(head.script[0].textContent)).toMatchObject({
            '@type': 'WebSite',
            url: 'https://momei.app/current/path?from=test',
            image: 'https://momei.app/logo.png',
        })
        expect(JSON.parse(head.script[1].textContent)).toEqual({ '@type': 'Thing', name: 'extra-node' })
    })

    it('builds article seo payload with article meta and blog posting structured data', () => {
        currentTitle.value = ''
        currentDescription.value = ''
        siteLogo.value = ''
        localeState.value = 'en-US'

        const seo = usePageSeo({
            type: 'article',
            title: 'Deep Dive',
            description: 'Article summary',
            path: '/posts/deep-dive',
            image: '/cover.png',
            locale: 'en-US',
            publishedAt: '2026-04-28T08:00:00.000Z',
            updatedAt: '2026-04-29T09:30:00.000Z',
            section: 'Testing',
            tags: ['Vitest', '', 'Nuxt'],
            authorName: 'CaoMeiYouRen',
            abstract: 'Structured abstract',
            about: ['Coverage', 'SEO'],
            wordCount: 2048,
            speakableSelectors: ['.summary', '', '.content p:first-child'],
            structuredData: { '@type': 'Thing', name: 'article-extra' },
        })

        expect(seo.canonicalUrl.value).toBe('https://momei.app/posts/deep-dive')
        expect(seo.imageUrl.value).toBe('https://momei.app/cover.png')
        expect(seo.shouldNoIndex.value).toBe(false)

        const head = resolveHeadPayload()
        expect(head.meta).toEqual(expect.arrayContaining([
            { property: 'og:type', content: 'article' },
            { property: 'og:locale', content: 'en_US' },
            { property: 'article:published_time', content: '2026-04-28T08:00:00.000Z' },
            { property: 'article:modified_time', content: '2026-04-29T09:30:00.000Z' },
            { property: 'article:section', content: 'Testing' },
            { property: 'article:tag', content: 'Vitest' },
            { property: 'article:tag', content: 'Nuxt' },
            { name: 'twitter:card', content: 'summary_large_image' },
        ]))
        expect(head.script).toHaveLength(2)

        const articleNode = JSON.parse(head.script[0].textContent)
        expect(articleNode).toMatchObject({
            '@type': 'BlogPosting',
            headline: 'Deep Dive',
            description: 'Article summary',
            inLanguage: 'en-US',
            abstract: 'Structured abstract',
            articleSection: 'Testing',
            keywords: 'Vitest, Nuxt',
            about: ['Coverage', 'SEO'],
            wordCount: 2048,
            datePublished: '2026-04-28T08:00:00.000Z',
            dateModified: '2026-04-29T09:30:00.000Z',
            image: 'https://momei.app/cover.png',
            author: {
                '@type': 'Person',
                name: 'CaoMeiYouRen',
            },
        })
        expect(articleNode.speakable).toEqual({
            '@type': 'SpeakableSpecification',
            cssSelector: ['.summary', '.content p:first-child'],
        })
        expect(JSON.parse(head.script[1].textContent)).toEqual({ '@type': 'Thing', name: 'article-extra' })
    })

    it('suppresses structured data for non-seo-ready locales and explicit noindex', () => {
        localeState.value = 'zh-TW'
        currentTitle.value = ''
        currentDescription.value = ''
        siteLogo.value = ''

        const seo = usePageSeo({
            type: 'collection',
            title: '分类页',
            locale: 'zh-TW',
            noindex: true,
            path: '/',
        })

        expect(seo.canonicalUrl.value).toBe('https://momei.app')
        expect(seo.imageUrl.value).toBeNull()
        expect(seo.shouldNoIndex.value).toBe(true)

        const head = resolveHeadPayload()
        expect(head.meta).toEqual(expect.arrayContaining([
            { name: 'description', content: 'Fallback description' },
            { name: 'robots', content: 'noindex, nofollow' },
            { property: 'og:locale', content: 'zh_TW' },
            { name: 'twitter:card', content: 'summary' },
        ]))
        expect(head.script).toEqual([])
    })
})
