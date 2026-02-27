import { test, expect } from '@playwright/test'

test.describe('Main Navigation E2E Tests', () => {
    test('should navigate to key pages from header nav', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('#nav-posts')).toBeVisible()
        await page.locator('#nav-posts').click()
        await expect(page).toHaveURL(/\/posts/)
        await expect(page.locator('main').first()).toBeVisible()

        await page.goto('/')
        await page.waitForLoadState('networkidle')
        await expect(page.locator('#nav-categories')).toBeVisible()
        await page.locator('#nav-categories').click()
        await expect(page).toHaveURL(/\/categories/)
        await expect(page.locator('main').first()).toBeVisible()

        await page.goto('/')
        await page.waitForLoadState('networkidle')
        await expect(page.locator('#nav-tags')).toBeVisible()
        await page.locator('#nav-tags').click()
        await expect(page).toHaveURL(/\/tags/)
        await expect(page.locator('main').first()).toBeVisible()

        await page.goto('/')
        await page.waitForLoadState('networkidle')
        await expect(page.locator('#nav-archives')).toBeVisible()
        await page.locator('#nav-archives').click()
        await expect(page).toHaveURL(/\/archives/)
        await expect(page.locator('main').first()).toBeVisible()

        await page.goto('/')
        await page.waitForLoadState('networkidle')
        await expect(page.locator('#nav-submit')).toBeVisible()
        await page.locator('#nav-submit').click()
        await expect(page).toHaveURL(/\/submit/)
        await expect(page.locator('.submit-form').first()).toBeVisible()
    })
})
