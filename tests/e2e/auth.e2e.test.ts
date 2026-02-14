import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers/auth.helper'

test.describe('Authentication E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
    })

    test('should show login page and allow login with valid credentials', async ({ page }) => {
        const auth = new AuthHelper(page)
        await auth.loginAsAdmin()

        // 进一步验证，尝试访问管理后台
        await page.goto('/admin')
        await expect(page).not.toHaveURL(/\/login/)
    })

    test('should show error message with invalid credentials', async ({ page }) => {
        await page.goto('/login')

        await page.fill('input#email', 'wrong@momei.test')
        await page.fill('input[type="password"]', 'wrongpassword')
        await page.click('button[type="submit"]')

        // 应该仍然在登录页
        expect(page.url()).toContain('/login')

        // 应该显示错误提示
        const errorMessage = page.locator('.p-message-error, .p-toast-message')
        await expect(errorMessage.first()).toBeVisible()
    })

    test('should logout successfully', async ({ page }) => {
        const auth = new AuthHelper(page)
        await auth.loginAsAdmin()
        await auth.logout()
    })

    test('should redirect unauthenticated users from admin pages', async ({ page }) => {
        await page.goto('/admin')
        // 验证是否重定向到了登录页
        await expect(page).toHaveURL(/\/login/)
    })
})
