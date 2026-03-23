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
    await expect(page).toHaveURL(/\/login(?:\?|$)/, { timeout: 20000 })
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

async function openNewDraftEditor(page: Page) {
    await page.goto('/admin/posts/new')
    await expect(page.locator('.editor-layout')).toBeVisible({ timeout: 20000 })
    await expect(page.locator('.title-input')).toBeVisible({ timeout: 20000 })
}

async function clickLanguageBadge(page: Page, languageCode: string) {
    const badge = page.locator('.translation-status-bar .translation-badge').filter({
        hasText: languageCode.toUpperCase(),
    }).first()

    await expect(badge).toBeVisible({ timeout: 10000 })
    await badge.click()
}

function getActiveLanguageBadge(page: Page) {
    return page.locator('.translation-status-bar .translation-badge.translation-badge--active').first()
}

function normalizeLocaleCode(languageCode: string) {
    const [language, region] = languageCode.split('-')

    if (!language || !region) {
        return languageCode
    }

    return `${language.toLowerCase()}-${region.toUpperCase()}`
}

async function pickDifferentLanguage(page: Page) {
    const badges = page.locator('.translation-status-bar .translation-badge')
    const activeBadge = getActiveLanguageBadge(page)

    await expect(activeBadge).toBeVisible({ timeout: 10000 })

    const currentLanguage = (await activeBadge.textContent())?.trim() || ''
    const badgeCount = await badges.count()

    for (let index = 0; index < badgeCount; index += 1) {
        const badge = badges.nth(index)
        const languageCode = ((await badge.textContent()) || '').trim()

        if (languageCode && languageCode !== currentLanguage) {
            return {
                currentLanguage,
                targetLanguage: languageCode,
            }
        }
    }

    throw new Error('No alternate language badge available for translation switching test')
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

    test('should switch language on a blank new draft without requiring save first', async ({ page }) => {
        await new AuthHelper(page).loginAsAdmin()
        await openNewDraftEditor(page)

        const { currentLanguage, targetLanguage } = await pickDifferentLanguage(page)

        await page.goto(`/admin/posts/new?language=${encodeURIComponent(normalizeLocaleCode(targetLanguage))}`)

        await expect(getActiveLanguageBadge(page)).toContainText(targetLanguage, { timeout: 20000 })
        await expect(getActiveLanguageBadge(page)).not.toContainText(currentLanguage)
        await expect(page.locator('.title-input')).toBeVisible({ timeout: 20000 })
    })

    test('should protect entered new draft from language switch before saving', async ({ page }) => {
        await new AuthHelper(page).loginAsAdmin()
        await openNewDraftEditor(page)

        await page.locator('.title-input').fill('Playwright unsaved draft')
        const originalUrl = page.url()
        const { currentLanguage, targetLanguage } = await pickDifferentLanguage(page)

        await clickLanguageBadge(page, targetLanguage)

        await expect(page).toHaveURL(originalUrl)
        await expect(page.locator('.title-input')).toHaveValue('Playwright unsaved draft')
        await expect(getActiveLanguageBadge(page)).toContainText(currentLanguage)
    })
})
