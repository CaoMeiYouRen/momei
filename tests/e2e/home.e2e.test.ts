import { test, expect } from '@playwright/test'

test.describe('Homepage E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
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
    // 寻找语言切换器按钮
        const langSwitcher = page.locator('.language-switcher, button:has-text("EN"), button:has-text("中文")')

        // 如果存在语言切换器
        if (await langSwitcher.count() > 0) {
            const currentLang = await page.getAttribute('html', 'lang')

            await langSwitcher.first().click()

            // 等待语言切换（通常会有 URL 变化或页面重载）
            await page.waitForTimeout(1000)

            const newLang = await page.getAttribute('html', 'lang')
            expect(newLang).not.toBe(currentLang)
        }
    })

    test('should toggle dark mode', async ({ page }) => {
    // 寻找主题切换按钮
        const themeToggle = page.locator('.theme-switcher, button:has(i.pi-moon), button:has(i.pi-sun)')

        if (await themeToggle.count() > 0) {
            const html = page.locator('html')
            const isDarkBefore = await html.evaluate((el) => el.classList.contains('dark'))

            await themeToggle.first().click()

            // 这里的 class 变化可能是异步的
            await page.waitForTimeout(500)
            const isDarkAfter = await html.evaluate((el) => el.classList.contains('dark'))
            expect(isDarkAfter).not.toBe(isDarkBefore)
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
