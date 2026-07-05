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

async function openCreatePost(page: any) {
    const createButton = page.getByRole('button', { name: /新建文章|Create/i }).first()
    await expect(createButton).toBeVisible({ timeout: 20000 })
    await createButton.click()

    try {
        await expect(page).toHaveURL(/\/admin\/posts\/new(?:\?|$)/, { timeout: 5000 })
    } catch {
        await page.goto('/admin/posts/new')
    }
}

test.describe('Mobile Critical Admin Flow E2E Tests', () => {
    test.describe.configure({ timeout: 90_000 })
    test.use({ storageState: hasStoredAuth() ? authFile : undefined })

    test('should cover login entry, admin navigation, and basic editor interaction on mobile', async ({ page }) => {
        if (!hasStoredAuth()) {
            // 无预存认证态时：验证登录页元素并完成 UI 登录
            await page.goto('/login')
            await expect(page.locator('input#email')).toBeVisible({ timeout: 20000 })
            await expect(page.locator('#password input')).toBeVisible({ timeout: 20000 })
            await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 20000 })
            await new AuthHelper(page).loginAsAdmin()
        }
        // 有预存认证态时：登录页移动端元素已由 auth.e2e.test.ts 覆盖，此处直接验证后台流程

        await page.goto('/admin/posts')
        await expect(page.locator('.admin-page-container')).toBeVisible({ timeout: 20000 })

        await openCreatePost(page)
        await expect(page).toHaveURL(/\/admin\/posts\/new(?:\?|$)/, { timeout: 20000 })
        await expect(page.locator('.editor-layout')).toBeVisible({ timeout: 20000 })

        await page.locator('.title-input').fill('Mobile editor smoke')

        const contentEditor = page.locator('.mavon-editor textarea, .mavon-editor .auto-textarea-input').first()
        await expect(contentEditor).toBeVisible({ timeout: 20000 })
        await contentEditor.fill('Mobile editor content smoke test.')
        await expect(contentEditor).toHaveValue(/Mobile editor content smoke test\./)
    })
})
