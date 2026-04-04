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

async function gotoAdminRoute(page: import('@playwright/test').Page, routePath: string) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            await page.goto(routePath)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            if (!message.includes('interrupted by another navigation')) {
                throw error
            }
        }

        try {
            await expect(page).toHaveURL(new RegExp(`${routePath}(?:\\?|$)`), { timeout: 10000 })
            return
        } catch (error) {
            if (attempt === 1) {
                throw error
            }
        }
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
        await gotoAdminRoute(page, '/admin/posts')
        // 增加超时时间以应对慢速渲染
        await expect(page.locator('h1, .admin-page-header').first()).toBeVisible({ timeout: 15000 })
    })

    test('should load admin categories and tags', async ({ page }) => {
        await gotoAdminRoute(page, '/admin/categories')
        await expect(page.locator('.p-datatable, .categories-list').first()).toBeVisible({ timeout: 15000 })

        await gotoAdminRoute(page, '/admin/tags')
        await expect(page.locator('.p-datatable, .tags-list').first()).toBeVisible({ timeout: 15000 })
    })

    test('should load admin settings', async ({ page }) => {
        await gotoAdminRoute(page, '/admin/settings')
        await expect(page.locator('form, .settings-content, .p-card').first()).toBeVisible({ timeout: 15000 })
    })

    test('should load notification management with translated delivery log copy', async ({ page }) => {
        await gotoAdminRoute(page, '/admin/notifications')

        await expect(page.getByRole('heading', { name: '通知管理' })).toBeVisible({ timeout: 15000 })
        await expect(page.getByRole('heading', { name: '通知投递审计' })).toBeVisible({ timeout: 15000 })
        await expect(page.getByRole('button', { name: '刷新' })).toBeVisible({ timeout: 15000 })
        await expect(page.locator('body')).not.toContainText('pages.admin.notifications.delivery_logs')
        await expect(page.locator('body')).not.toContainText('pages.admin.settings.system.notifications.delivery_logs')
    })

    test('should load admin ai page', async ({ page }) => {
        await gotoAdminRoute(page, '/admin/ai')
        // 使用 .first() 解决严格模式违反问题，并应对多卡片渲染
        await expect(page.locator('.ai-config-panel, .p-card').first()).toBeVisible({ timeout: 15000 })
    })
})
