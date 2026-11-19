import { test, expect } from '@playwright/test'

/**
 * 语言偏好与根路径重定向（首页缓存解耦后）。
 *
 * 背景：`detectBrowserLanguage.useCookie` 关闭后，`/` 不再由 SSR 写 `i18n_redirected`，
 * 语言检测改由客户端完成，偏好只在用户显式切换时由 `useLocalePreference` 写入。
 * 本组用例锁住：五语根重定向、显式切换写偏好、偏好回访生效、首页响应头可缓存。
 */

const ROOT_REDIRECTS = [
    { language: 'zh-CN', path: '/', lang: 'zh-CN' },
    { language: 'en-US', path: '/en-US', lang: 'en-US' },
    { language: 'zh-TW', path: '/zh-TW', lang: 'zh-TW' },
    { language: 'ja-JP', path: '/ja-JP', lang: 'ja-JP' },
    { language: 'ko-KR', path: '/ko-KR', lang: 'ko-KR' },
] as const

test.describe('语言偏好与根路径重定向', () => {
    for (const redirect of ROOT_REDIRECTS) {
        test(`浏览器语言 ${redirect.language} 访问根路径落到 ${redirect.path}`, async ({ browser, baseURL }) => {
            const context = await browser.newContext({ baseURL, locale: redirect.language })
            const page = await context.newPage()

            try {
                await page.goto('/')
                await expect.poll(() => new URL(page.url()).pathname, { timeout: 15000 }).toBe(redirect.path)
                await expect.poll(() => page.getAttribute('html', 'lang'), { timeout: 10000 }).toBe(redirect.lang)
            } finally {
                await context.close()
            }
        })
    }

    test('显式切换语言写入偏好 cookie 并在回访根路径时生效', async ({ page, context, baseURL }) => {
        await page.goto('/')
        const trigger = page.locator('#lang-switcher button')
        await expect(trigger).toBeVisible()

        /* 菜单在首屏未水合时点击会静默失效，按「点击 → 断言目标状态」有界重试。 */
        const targetItem = page.locator('#language_menu [role="menuitem"]').nth(1)
        await expect(async () => {
            await trigger.click({ timeout: 3000 })
            await expect(targetItem).toBeVisible({ timeout: 3000 })
            await targetItem.click({ timeout: 3000 })
            await expect.poll(() => new URL(page.url()).pathname, { timeout: 3000 }).not.toBe('/')
        }).toPass({ timeout: 20000 })

        const cookies = await context.cookies()
        const preference = cookies.find((cookie) => cookie.name === 'i18n_redirected')

        expect(preference?.value).toBeTruthy()
        const preferred = preference?.value ?? ''
        const expectedPath = preferred === 'zh-CN' ? '/' : `/${preferred}`

        await page.goto('/')
        await expect.poll(() => new URL(page.url()).pathname, { timeout: 15000 }).toBe(expectedPath)
        await expect.poll(() => page.getAttribute('html', 'lang'), { timeout: 10000 }).toBe(preferred)

        const response = await page.request.get(`${baseURL ?? ''}/`)
        expect((response.headers()['set-cookie'] ?? '').includes('i18n_redirected')).toBe(false)
    })

    test('首页响应不写 Set-Cookie 且可被 SWR 缓存', async ({ request }) => {
        const response = await request.get('/')
        const headers = response.headers()

        expect(response.status()).toBe(200)
        expect(headers['set-cookie']).toBeUndefined()
        expect(headers['cache-control'] ?? '').toContain('s-maxage')
    })
})
