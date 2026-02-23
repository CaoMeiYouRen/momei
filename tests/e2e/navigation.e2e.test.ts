import { test, expect } from '@playwright/test'

test.describe('Main Navigation E2E Tests', () => {
    test('should navigate to key pages from header nav', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        await page.click('#nav-posts')
        await expect(page).toHaveURL(/\/posts/)
        await expect(page.locator('main').first()).toBeVisible()

        await page.goto('/')
        await page.click('#nav-categories')
        await expect(page).toHaveURL(/\/categories/)
        await expect(page.locator('main').first()).toBeVisible()

        await page.goto('/')
        await page.click('#nav-tags')
        await expect(page).toHaveURL(/\/tags/)
        await expect(page.locator('main').first()).toBeVisible()

        await page.goto('/')
        await page.click('#nav-archives')
        await expect(page).toHaveURL(/\/archives/)
        await expect(page.locator('main').first()).toBeVisible()

        await page.goto('/')
        await page.click('#nav-submit')
        await expect(page).toHaveURL(/\/submit/)
        await expect(page.locator('.submit-form').first()).toBeVisible()
    })
})
