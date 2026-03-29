import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

async function setLocaleCookie(page: Page, baseURL: string | undefined, locale: string) {
    await page.context().addCookies([
        {
            name: 'i18n_redirected',
            value: locale,
            url: baseURL || 'http://127.0.0.1:3001',
        },
    ])
}

async function switchToDifferentLocale(page: Page) {
    const currentLang = await page.getAttribute('html', 'lang')

    await page.goto('/en-US')

    await expect.poll(async () => await page.getAttribute('html', 'lang')).not.toBe(currentLang)
}

test.describe('Homepage E2E Tests', () => {
    test.beforeEach(async ({ page, baseURL }) => {
        await setLocaleCookie(page, baseURL, 'zh-CN')
        await page.goto('/')
    })

    test('should load the homepage and show correct title', async ({ page }) => {
    // 检查页面标题 (可能包含 "Momei" 或 "墨梅")
        const title = await page.title()
        expect(title).toMatch(/Momei|墨梅/)
    })

    test('should have a visible header and logo', async ({ page }) => {
        const header = page.locator('header')
        await expect(header).toBeVisible()

        // 假设 Logo 有特定的类名或 alt 属性
        const logo = page.locator('img[alt*="Momei"], .app-logo')
        if (await logo.count() > 0) {
            await expect(logo.first()).toBeVisible()
        }
    })

    test('should switch languages correctly', async ({ page }) => {
        await switchToDifferentLocale(page)
    })

    test('should toggle dark mode', async ({ page }) => {
    // 寻找主题切换按钮
        const themeToggle = page.locator('#theme-switcher, .theme-switcher, button:has(.pi-moon), button:has(.pi-sun)')

        if (await themeToggle.count() > 0) {
            const html = page.locator('html')
            const isDarkBefore = await html.evaluate((el) => el.classList.contains('dark'))

            await expect(themeToggle.first()).toBeVisible()
            await themeToggle.first().click()

            await expect.poll(async () => await html.evaluate((el) => el.classList.contains('dark')), { timeout: 3000 }).not.toBe(isDarkBefore)
        }
    })

    test('should navigate to search page', async ({ page }) => {
        const searchButton = page.locator('.app-search, button:has(i.pi-search)')
        if (await searchButton.count() > 0) {
            await searchButton.first().click()
            // 检查是否出现了搜索输入框或跳转到了搜索页
            const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="Search"]')
            await expect(searchInput).toBeVisible()
        }
    })
})
