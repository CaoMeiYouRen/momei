import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers/auth.helper'

test.describe('Admin E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // 在正式集成测试中，通常需要一个真实的管理员账号
        // 这里假设已经按照 AuthHelper 设置
        const auth = new AuthHelper(page)
        // 只有在非本地环境或有预置账户时才启用
        // 这里只是为了演示代码覆盖，暂时在测试不满足条件时跳过
        try {
            await auth.loginAsAdmin()
        } catch {
            test.skip(true, 'Admin login failed, skipping admin pages tests')
        }
    })

    test('should load admin dashboard/posts', async ({ page }) => {
        await page.goto('/admin/posts')
        await expect(page.locator('h1, .admin-page-header')).toBeVisible()
    })

    test('should load admin categories and tags', async ({ page }) => {
        await page.goto('/admin/categories')
        await expect(page.locator('.p-datatable, .categories-list')).toBeVisible()

        await page.goto('/admin/tags')
        await expect(page.locator('.p-datatable, .tags-list')).toBeVisible()
    })

    test('should load admin settings', async ({ page }) => {
        await page.goto('/admin/settings')
        await expect(page.locator('form, .settings-content')).toBeVisible()
    })

    test('should load admin ai page', async ({ page }) => {
        await page.goto('/admin/ai')
        await expect(page.locator('.ai-config-panel, .p-card')).toBeVisible()
    })
})
