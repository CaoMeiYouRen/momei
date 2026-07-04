import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect, type Page } from '@playwright/test'
import { AuthHelper } from './helpers/auth.helper'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const authFile = path.join(__dirname, '.auth', 'admin.json')

function hasStoredAuth(): boolean {
    try {
        return fs.existsSync(authFile)
    } catch {
        return false
    }
}

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

async function expectProtectedRouteRedirectsToLogin(page: Page, routePath: string) {
    try {
        await page.goto(routePath)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (!message.includes('interrupted by another navigation')) {
            throw error
        }
    }

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

async function navigateBlankDraftToLanguage(page: Page, languageCode: string) {
    try {
        await page.goto(`/admin/posts/new?language=${encodeURIComponent(languageCode)}`)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (!message.includes('interrupted by another navigation')) {
            throw error
        }
    }
}

async function expectBlankDraftLanguage(page: Page, targetLanguage: string) {
    await expect(getActiveLanguageBadge(page)).toContainText(targetLanguage, { timeout: 5000 })
    await expect(page.locator('.title-input')).toBeVisible({ timeout: 20000 })
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
    test.use({ storageState: hasStoredAuth() ? authFile : undefined })

    // FIXME: E2E 测试环境 seed-test 插件未正确创建测试用户，待排查后恢复
    test.fixme('should keep authenticated settings page stable after refresh with bounded session fetches', async ({ page }) => {
        let sessionRequestCount = 0
        page.on('request', (request) => {
            if (request.url().includes('/api/auth/get-session')) {
                sessionRequestCount += 1
            }
        })

        await new AuthHelper(page).ensureAdminSession()

        await ensureAuthenticatedSettings(page)

        sessionRequestCount = 0
        await page.reload({ waitUntil: 'domcontentloaded' })

        await expect(page.locator('.settings-page')).toBeVisible({ timeout: 20000 })
        await expect(page.locator('#user-menu-btn')).toBeVisible({ timeout: 20000 })
        await page.waitForTimeout(1000)
        expect(sessionRequestCount).toBeLessThanOrEqual(2)
    })

    test.fixme('should sync logout across tabs and deny protected navigation in the other tab', async ({ browser, baseURL }) => {
        const context = await browser.newContext({
            baseURL,
            ...(hasStoredAuth() ? { storageState: authFile } : {}),
        })

        const primaryTab = await context.newPage()
        const secondaryTab = await context.newPage()

        try {
            await new AuthHelper(primaryTab).ensureAdminSession()

            await ensureAuthenticatedSettings(primaryTab)
            await ensureAuthenticatedAdmin(secondaryTab)

            await logoutFromHeader(primaryTab)

            await expectProtectedRouteRedirectsToLogin(secondaryTab, '/admin/posts')
        } finally {
            await context.close()
        }
    })

    test.fixme('should redirect to login after session expiry invalidates stale client state', async ({ page }) => {
        await new AuthHelper(page).ensureAdminSession()

        await ensureAuthenticatedSettings(page)

        await page.context().clearCookies()
        await expectProtectedRouteRedirectsToLogin(page, '/admin/posts')
    })

    test.fixme('should block immediate protected revisit after logout in the current tab', async ({ page }) => {
        await new AuthHelper(page).ensureAdminSession()

        await ensureAuthenticatedSettings(page)

        await logoutFromHeader(page)
        await expectProtectedRouteRedirectsToLogin(page, '/admin/posts')
    })

    test.fixme('should switch language on a blank new draft without requiring save first', async ({ page }) => {
        await new AuthHelper(page).ensureAdminSession()

        await openNewDraftEditor(page)

        const { currentLanguage, targetLanguage } = await pickDifferentLanguage(page)
        const normalizedTargetLanguage = normalizeLocaleCode(targetLanguage)

        let switched = false

        for (let attempt = 0; attempt < 2; attempt += 1) {
            await navigateBlankDraftToLanguage(page, normalizedTargetLanguage)
            await expect(page).toHaveURL(/\/admin\/posts\/new(?:\?|$)/, { timeout: 20000 })

            try {
                await expectBlankDraftLanguage(page, targetLanguage)
                switched = true
                break
            } catch (error) {
                if (attempt === 1) {
                    throw error
                }
            }
        }

        expect(switched).toBe(true)
        await expect(getActiveLanguageBadge(page)).not.toContainText(currentLanguage)
    })

    test.fixme('should protect entered new draft from language switch before saving', async ({ page, browserName }) => {
        test.skip(browserName === 'firefox', 'Flaky in Firefox CI — Playwright fill() + PrimeVue InputText v-model timing issue (2026-06)')
        await new AuthHelper(page).ensureAdminSession()

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
