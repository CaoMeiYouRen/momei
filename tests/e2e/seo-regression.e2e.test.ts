import { test, expect, type Page } from '@playwright/test'

async function setLocaleCookie(page: Page, locale: 'zh-CN' | 'en-US') {
    await page.context().addCookies([
        {
            name: 'i18n_redirected',
            value: locale,
            url: 'http://localhost:3001',
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

test.describe('SEO Regression', () => {
    test('should render multilingual head tags for homepage', async ({ page }) => {
        await setLocaleCookie(page, 'zh-CN')
        await page.goto('/')
        await page.waitForLoadState('domcontentloaded')

        await expectCanonicalPath(page, '/')
        await expectAlternatePath(page, 'zh-CN', '/')
        await expectAlternatePath(page, 'en-US', '/en-US')
        await expectLocaleMeta(page, 'zh-CN', 'zh_CN')
        await expectStructuredLanguage(page, 'zh-CN')
    })

    test('should render multilingual head tags for english static pages', async ({ page }) => {
        await setLocaleCookie(page, 'en-US')
        await page.goto('/en-US/about')
        await page.waitForLoadState('domcontentloaded')

        await expectCanonicalPath(page, '/en-US/about')
        await expectAlternatePath(page, 'zh-CN', '/about')
        await expectAlternatePath(page, 'en-US', '/en-US/about')
        await expectLocaleMeta(page, 'en-US', 'en_US')
    })

    test('should render article seo metadata on post detail pages', async ({ page }) => {
        await setLocaleCookie(page, 'zh-CN')
        const response = await page.request.get('http://localhost:3001/api/posts?page=1&limit=1&status=published')
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

    test('should render collection seo metadata on category pages', async ({ page }) => {
        await setLocaleCookie(page, 'zh-CN')
        const response = await page.request.get('http://localhost:3001/api/categories?page=1&limit=1')
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
