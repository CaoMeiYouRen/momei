import { test, expect } from '@playwright/test'

test.describe('Theme Switcher E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
    })

    test('should toggle dark mode during session', async ({ page }) => {
        const html = page.locator('html')
        const themeToggle = page.locator('.theme-switcher, button:has(.pi-moon), button:has(.pi-sun)')

        // Wait for page to be ready
        await expect(themeToggle.first()).toBeVisible()

        const isDarkBefore = await html.evaluate((el) => el.classList.contains('dark'))

        // Click to toggle
        await themeToggle.first().click()

        // Wait for class to change
        await expect(async () => {
            const isDarkAfter = await html.evaluate((el) => el.classList.contains('dark'))
            expect(isDarkAfter).not.toBe(isDarkBefore)
        }).toPass({ timeout: 5000 })
    })
})
