import { test, expect, type Page } from '@playwright/test'
import { AuthHelper } from './helpers/auth.helper'

async function openUserMenu(page: Page) {
    const userMenuButton = page.locator('#user-menu-btn')
    await expect(userMenuButton).toBeVisible({ timeout: 20000 })
    await userMenuButton.click()
}

async function logoutFromHeader(page: Page) {
    await openUserMenu(page)

    const logoutItem = page.getByRole('menuitem', {
        name: /退出登录|注销|Logout/i,
    }).first()

    await expect(logoutItem).toBeVisible({ timeout: 10000 })
    await logoutItem.click()
    await expect(page.locator('#login-btn')).toBeVisible({ timeout: 20000 })
}

async function ensureAuthenticatedSettings(page: Page) {
    await page.goto('/settings')
    await expect(page.locator('.settings-page')).toBeVisible({ timeout: 20000 })
    await expect(page).toHaveURL(/\/settings(?:\?|$)/)
    await expect(page.locator('#user-menu-btn')).toBeVisible({ timeout: 20000 })
}

async function ensureAuthenticatedAdmin(page: Page) {
    await page.goto('/admin/posts')
    await expect(page.locator('.admin-page-container')).toBeVisible({ timeout: 20000 })
    await expect(page).toHaveURL(/\/admin\/posts(?:\?|$)/)
}

test.describe('Auth Session Governance E2E Tests', () => {
    test.describe.configure({ timeout: 90_000 })

    test('should keep authenticated settings page stable after refresh with bounded session fetches', async ({ page }) => {
        let sessionRequestCount = 0
        page.on('request', (request) => {
            if (request.url().includes('/api/auth/get-session')) {
                sessionRequestCount += 1
            }
        })

        await new AuthHelper(page).loginAsAdmin()
        await ensureAuthenticatedSettings(page)

        sessionRequestCount = 0
        await page.reload({ waitUntil: 'domcontentloaded' })

        await expect(page.locator('.settings-page')).toBeVisible({ timeout: 20000 })
        await expect(page.locator('#user-menu-btn')).toBeVisible({ timeout: 20000 })
        await page.waitForTimeout(1000)
        expect(sessionRequestCount).toBeLessThanOrEqual(2)
    })

    test('should sync logout across tabs and deny protected navigation in the other tab', async ({ browser, baseURL }) => {
        const context = await browser.newContext({
            baseURL,
        })

        const primaryTab = await context.newPage()
        const secondaryTab = await context.newPage()

        try {
            await new AuthHelper(primaryTab).loginAsAdmin()
            await ensureAuthenticatedSettings(primaryTab)
            await ensureAuthenticatedAdmin(secondaryTab)

            await logoutFromHeader(primaryTab)

            await secondaryTab.goto('/admin/posts')
            await expect(secondaryTab).toHaveURL(/\/login(?:\?|$)/, { timeout: 20000 })
        } finally {
            await context.close().catch(() => {})
        }
    })

    test('should redirect to login after session expiry invalidates stale client state', async ({ page }) => {
        await new AuthHelper(page).loginAsAdmin()
        await ensureAuthenticatedSettings(page)

        await page.context().clearCookies()
        await page.goto('/admin/posts')

        await expect(page).toHaveURL(/\/login(?:\?|$)/, { timeout: 20000 })
    })

    test('should block immediate protected revisit after logout in the current tab', async ({ page }) => {
        await new AuthHelper(page).loginAsAdmin()
        await ensureAuthenticatedSettings(page)

        await logoutFromHeader(page)
        await page.goto('/admin/posts')

        await expect(page).toHaveURL(/\/login(?:\?|$)/, { timeout: 20000 })
    })
})
