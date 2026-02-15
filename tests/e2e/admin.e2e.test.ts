import { test } from '@playwright/test'

test.describe.skip('Admin E2E Tests', () => {
    // 这些测试需要登录和数据库数据，暂时跳过
    // 待实现测试数据设置后再启用

    test.beforeEach(async () => {
        // const auth = new AuthHelper(page)
        // await auth.loginAsAdmin()
    })

    test('should allow creating a new post', async ({ page }) => {
        await page.goto('/admin/posts')
    })

    test('should allow editing an existing post', async ({ page }) => {
        await page.goto('/admin/posts')
    })

    test('should allow toggling settings panel', async ({ page }) => {
        await page.goto('/admin/posts/new')
    })
})
