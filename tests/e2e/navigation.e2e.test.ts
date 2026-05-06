import { test, expect, type Page } from '@playwright/test'

const retryableNavigationErrors = [
    'interrupted by another navigation',
    'NS_BINDING_ABORTED',
    'frame was detached',
]
const homePath = '/en-US'
const homeUrlPattern = /\/en-US(?:\?|$)/

async function openPath(page: Page, targetPath: string, urlPattern: RegExp) {
    const errorPage = page.locator('.error-page')
    const retryButton = page.locator('#retry-btn-global')

    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            await page.goto(targetPath, { waitUntil: 'commit' })
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            if (!retryableNavigationErrors.some((fragment) => message.includes(fragment))) {
                throw error
            }

            if (!urlPattern.test(page.url()) && attempt === 0) {
                continue
            }
        }

        await expect(page).toHaveURL(urlPattern, { timeout: 20000 })
        await expect(page.locator('.app-header')).toBeVisible({ timeout: 20000 })

        if (await errorPage.count() === 0) {
            return
        }

        if (attempt === 1) {
            await expect(errorPage).toHaveCount(0)
        }

        await expect(retryButton).toBeVisible({ timeout: 10000 })
        await retryButton.click()
        await expect(errorPage).toHaveCount(0, { timeout: 20000 })
    }
}

async function openHome(page: Page) {
    await openPath(page, homePath, homeUrlPattern)
}

async function navigateFromHome(
    page: Page,
    linkSelector: string,
    urlPattern: RegExp,
    readySelector: string,
) {
    await openHome(page)

    const navLink = page.locator(linkSelector)
    await expect(navLink).toBeVisible({ timeout: 20000 })
    const targetPath = await navLink.getAttribute('href')

    expect(targetPath).toBeTruthy()
    expect(targetPath).toMatch(urlPattern)

    await openPath(page, targetPath!, urlPattern)

    await expect(page.locator(readySelector).first()).toBeVisible({ timeout: 20000 })
}

test.describe('Main Navigation E2E Tests', () => {
    test('should load key pages linked from header nav', async ({ page }) => {
        await navigateFromHome(page, '#nav-posts', /\/posts/, 'main')
        await navigateFromHome(page, '#nav-categories', /\/categories/, 'main')
        await navigateFromHome(page, '#nav-tags', /\/tags/, 'main')
        await navigateFromHome(page, '#nav-archives', /\/archives/, 'main')
        await navigateFromHome(page, '#nav-submit', /\/submit/, '.submit-form')
    })
})
