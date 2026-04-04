import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect } from '@playwright/test'
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

async function ensureAdminSession(page: import('@playwright/test').Page) {
    if (hasStoredAuth()) {
        return
    }

    await new AuthHelper(page).loginAsAdmin()
}

test.describe('Admin Posts Shortcut E2E Tests', () => {
    test.use({
        storageState: hasStoredAuth() ? authFile : undefined,
    })

    test('shows desktop shortcut and navigates to posts management', async ({ page }) => {
        await ensureAdminSession(page)

        await page.setViewportSize({ width: 1440, height: 900 })
        await page.goto('/')

        const shortcutButton = page.locator('#admin-posts-shortcut')
        await expect(shortcutButton).toBeVisible({ timeout: 20000 })

        await shortcutButton.click()

        await expect(page).toHaveURL(/\/admin\/posts(?:\?|$)/, { timeout: 20000 })
        await expect(page.locator('.admin-page-container')).toBeVisible({ timeout: 20000 })
    })

    test('shows mobile shortcut and navigates to posts management', async ({ page }) => {
        await ensureAdminSession(page)

        await page.setViewportSize({ width: 390, height: 844 })
        await page.goto('/')

        const shortcutButton = page.locator('#mobile-admin-posts-btn')
        await expect(shortcutButton).toBeVisible({ timeout: 20000 })

        await shortcutButton.click()

        await expect(page).toHaveURL(/\/admin\/posts(?:\?|$)/, { timeout: 20000 })
        await expect(page.locator('.admin-page-container')).toBeVisible({ timeout: 20000 })
    })
})

test.describe('Admin Posts Shortcut Anonymous State', () => {
    test.use({ storageState: undefined })

    test('hides admin shortcut for anonymous visitors', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await page.goto('/')

        await expect(page.locator('#admin-posts-shortcut')).toHaveCount(0)

        await page.setViewportSize({ width: 390, height: 844 })
        await page.reload()

        await expect(page.locator('#mobile-admin-posts-btn')).toHaveCount(0)
    })
})
