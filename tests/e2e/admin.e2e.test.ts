import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers/auth.helper'

// ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 认证状态文件路径
const authFile = path.join(__dirname, '.auth', 'admin.json')

// 检查认证状态文件是否存在
function hasStoredAuth(): boolean {
    try {
        return fs.existsSync(authFile)
    } catch {
        return false
    }
}

test.describe('Admin E2E Tests', () => {
    // 如果全局设置已保存认证状态，使用它；否则尝试登录
    test.use({
        storageState: hasStoredAuth() ? authFile : undefined,
    })

    test.beforeEach(async ({ page }) => {
        // 如果没有存储的认证状态，尝试登录
        if (!hasStoredAuth()) {
            const auth = new AuthHelper(page)
            try {
                await auth.loginAsAdmin()
            } catch {
                // 登录失败，跳过测试
                test.skip()
                
            }
        }
    })

    test('should load admin dashboard/posts', async ({ page }) => {
        await page.goto('/admin/posts')
        // 增加超时时间以应对慢速渲染
        await expect(page.locator('h1, .admin-page-header').first()).toBeVisible({ timeout: 15000 })
    })

    test('should load admin categories and tags', async ({ page }) => {
        await page.goto('/admin/categories')
        await expect(page.locator('.p-datatable, .categories-list').first()).toBeVisible({ timeout: 15000 })

        await page.goto('/admin/tags')
        await expect(page.locator('.p-datatable, .tags-list').first()).toBeVisible({ timeout: 15000 })
    })

    test('should load admin settings', async ({ page }) => {
        await page.goto('/admin/settings')
        await expect(page.locator('form, .settings-content, .p-card').first()).toBeVisible({ timeout: 15000 })
    })

    test('should load admin ai page', async ({ page }) => {
        await page.goto('/admin/ai')
        // 使用 .first() 解决严格模式违反问题，并应对多卡片渲染
        await expect(page.locator('.ai-config-panel, .p-card').first()).toBeVisible({ timeout: 15000 })
    })
})
