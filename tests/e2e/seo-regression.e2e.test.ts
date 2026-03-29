import { test, expect, type Page } from '@playwright/test'

async function setLocaleCookie(page: Page, baseURL: string | undefined, locale: 'zh-CN' | 'en-US' | 'ja-JP') {
    await page.context().addCookies([
        {
            name: 'i18n_redirected',
            value: locale,
            url: baseURL || 'http://127.0.0.1:3001',
        },
    ])
}

async function collectStructuredData(page: Page) {
    const payloads = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes
        .map((node) => node.textContent || '')
        .filter(Boolean))

    return payloads.flatMap((payload) => {
        try {
            const parsed = JSON.parse(payload) as Record<string, unknown> | Record<string, unknown>[]
            return Array.isArray(parsed) ? parsed : [parsed]
        } catch {
            return []
        }
    })
}

async function waitForHead(page: Page, canonicalPath: string) {
    await expect.poll(async () => page.locator('link[rel="canonical"]').first().getAttribute('href')).toContain(canonicalPath)
}

async function expectCanonicalPath(page: Page, canonicalPath: string) {
    await waitForHead(page, canonicalPath)

    const canonicalHref = await page.locator('link[rel="canonical"]').first().getAttribute('href')
    expect(canonicalHref).toBeTruthy()
    expect(new URL(canonicalHref!).pathname).toBe(canonicalPath)
}

async function expectAlternatePath(page: Page, hreflang: string, expectedPath: string) {
    const selector = `link[rel="alternate"][hreflang="${hreflang}"]`

    await expect.poll(async () => page.locator(selector).first().getAttribute('href')).toContain(expectedPath)

    const href = await page.locator(selector).first().getAttribute('href')
    expect(href).toBeTruthy()
    expect(new URL(href!).pathname).toBe(expectedPath)
}

async function expectStructuredLanguage(page: Page, locale: string) {
    await expect.poll(async () => {
        const nodes = await collectStructuredData(page)
        return nodes.some((node) => node.inLanguage === locale)
    }).toBe(true)
}

async function expectLocaleMeta(page: Page, locale: string, ogLocale: string) {
    await expect.poll(async () => page.locator('html').getAttribute('lang')).toBe(locale)
    await expect.poll(async () => page.locator('meta[property="og:locale"]').getAttribute('content')).toBe(ogLocale)
    await expect.poll(async () => page.locator('meta[name="description"]').getAttribute('content')).not.toBeNull()
}

async function expectOgAlternateLocales(page: Page, expectedLocales: string[]) {
    await expect.poll(async () => page.locator('meta[property="og:locale:alternate"]').evaluateAll((nodes) => nodes
        .map((node) => node.getAttribute('content') || '')
        .filter(Boolean))).toEqual(expectedLocales)
}

test.describe('SEO Regression', () => {
    test('should render multilingual head tags for homepage', async ({ page, baseURL }) => {
        await setLocaleCookie(page, baseURL, 'zh-CN')
        await page.goto('/')
        await page.waitForLoadState('domcontentloaded')

        await expectCanonicalPath(page, '/')
        await expectAlternatePath(page, 'zh-CN', '/')
        await expectAlternatePath(page, 'en-US', '/en-US')
        await expectAlternatePath(page, 'ja-JP', '/ja-JP')
        await expectLocaleMeta(page, 'zh-CN', 'zh_CN')
        await expectOgAlternateLocales(page, ['en_US', 'ja_JP'])
        await expectStructuredLanguage(page, 'zh-CN')
    })

    test('should render multilingual head tags for english static pages', async ({ page, baseURL }) => {
        await setLocaleCookie(page, baseURL, 'en-US')
        await page.goto('/en-US/about')
        await page.waitForLoadState('domcontentloaded')

        await expectCanonicalPath(page, '/en-US/about')
        await expectAlternatePath(page, 'zh-CN', '/about')
        await expectAlternatePath(page, 'en-US', '/en-US/about')
        await expectAlternatePath(page, 'ja-JP', '/ja-JP/about')
        await expectLocaleMeta(page, 'en-US', 'en_US')
        await expectOgAlternateLocales(page, ['zh_CN', 'ja_JP'])
    })

    test('should render multilingual head tags for japanese static pages', async ({ page, baseURL }) => {
        await setLocaleCookie(page, baseURL, 'ja-JP')
        await page.goto('/ja-JP/about')
        await page.waitForLoadState('domcontentloaded')

        await expectCanonicalPath(page, '/ja-JP/about')
        await expectAlternatePath(page, 'zh-CN', '/about')
        await expectAlternatePath(page, 'en-US', '/en-US/about')
        await expectAlternatePath(page, 'ja-JP', '/ja-JP/about')
        await expectLocaleMeta(page, 'ja-JP', 'ja_JP')
        await expectOgAlternateLocales(page, ['en_US', 'zh_CN'])
    })

    test('should render article seo metadata on post detail pages', async ({ page, baseURL }) => {
        await setLocaleCookie(page, baseURL, 'zh-CN')
        const response = await page.request.get(new URL('/api/posts?page=1&limit=1&status=published', baseURL || 'http://127.0.0.1:3001').toString())
        const payload = await response.json()
        const post = payload?.data?.items?.[0]

        test.skip(!post, 'No published posts available for SEO regression')

        const postPath = `/posts/${post.slug || post.id}`

        await page.goto(postPath)
        await page.waitForLoadState('domcontentloaded')

        await expectCanonicalPath(page, postPath)
        await expectLocaleMeta(page, 'zh-CN', 'zh_CN')
        await expect.poll(async () => page.locator('meta[property="og:type"]').getAttribute('content')).toBe('article')
        await expectStructuredLanguage(page, 'zh-CN')
    })

    test('should render collection seo metadata on category pages', async ({ page, baseURL }) => {
        await setLocaleCookie(page, baseURL, 'zh-CN')
        const response = await page.request.get(new URL('/api/categories?page=1&limit=1', baseURL || 'http://127.0.0.1:3001').toString())
        const payload = await response.json()
        const category = payload?.data?.items?.[0]

        const categoryPath = category ? `/categories/${category.slug || category.id}` : '/categories'

        await page.goto(categoryPath)
        await page.waitForLoadState('domcontentloaded')

        await expectCanonicalPath(page, categoryPath)
        await expectLocaleMeta(page, 'zh-CN', 'zh_CN')
        await expectStructuredLanguage(page, 'zh-CN')
    })
})
