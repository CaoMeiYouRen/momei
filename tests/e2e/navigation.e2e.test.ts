import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

async function navigateFromHome(
    page: Page,
    linkSelector: string,
    urlPattern: RegExp,
    readySelector: string,
) {
    await page.goto('/')
    await expect(page.locator('.app-header')).toBeVisible()
    await expect(page.locator(linkSelector)).toBeVisible()

    await Promise.all([
        page.waitForURL(urlPattern),
        page.locator(linkSelector).click(),
    ])

    await expect(page.locator(readySelector).first()).toBeVisible()
}

test.describe('Main Navigation E2E Tests', () => {
    test('should navigate to key pages from header nav', async ({ page }) => {
        await navigateFromHome(page, '#nav-posts', /\/posts/, 'main')
        await navigateFromHome(page, '#nav-categories', /\/categories/, 'main')
        await navigateFromHome(page, '#nav-tags', /\/tags/, 'main')
        await navigateFromHome(page, '#nav-archives', /\/archives/, 'main')
        await navigateFromHome(page, '#nav-submit', /\/submit/, '.submit-form')
    })
})
