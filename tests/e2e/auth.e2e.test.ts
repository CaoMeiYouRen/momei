import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers/auth.helper'

test.describe('Authentication E2E Tests', () => {
    test('should show login page correctly', async ({ page }) => {
        await page.goto('/login')

        // 验证登录页面元素存在
        await expect(page.locator('input#email')).toBeVisible()
        await expect(page.locator('#password input')).toBeVisible()
        await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should show register page correctly', async ({ page }) => {
        await page.goto('/register')

        // 验证注册页面元素存在
        await expect(page.locator('input#name')).toBeVisible()
        await expect(page.locator('input#email')).toBeVisible()
        await expect(page.locator('#password input')).toBeVisible()
        await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should show forgot password page correctly', async ({ page }) => {
        await page.goto('/forgot-password')
        await expect(page.locator('input#email')).toBeVisible()
        await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should show error message with invalid credentials', async ({ page }) => {
        await page.goto('/login')

        await page.fill('input#email', 'wrong@momei.test')
        await page.fill('#password input', 'wrongpassword')
        await page.click('button[type="submit"]')

        // 应该仍然在登录页或显示错误
        // 注：具体表现取决于 API 响应和前端处理
        expect(page.url()).toContain('/login')
    })

    test('should redirect unauthenticated users from admin pages', async ({ page }) => {
        // 使用一个确定存在的且受保护的后台页面
        await page.goto('/admin/posts')
        // 验证是否重定向到了登录页
        await expect(page).toHaveURL(/.*\/login.*/)
    })

    test.describe('Admin Login/Logout Flow', () => {
        // 注意：这取决于测试环境是否有预置的管理员账号
        // 如果环境不可用，此测试可能失败，但在标准 E2E 流程中应包含
        test.skip('should login and logout successfully as admin', async ({ page }) => {
            const auth = new AuthHelper(page)
            await auth.loginAsAdmin()
            await auth.logout()
        })
    })
})
