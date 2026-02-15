import { test, expect } from '@playwright/test'

test.describe.skip('Post Reading E2E Tests', () => {
    // 这些测试需要数据库数据，暂时跳过
    // 待实现测试数据设置后再启用

    test('should find and navigate to the test post', async ({ page }) => {
        await page.goto('/')
        const postLink = page.locator('text=Hello Momei Test')
        await expect(postLink.first()).toBeVisible()
    })

    test('should display Table of Contents', async ({ page }) => {
        await page.goto('/posts/hello-momei-test')
        const toc = page.locator('.toc')
        await expect(toc).toBeVisible()
    })

    test('should render markdown content correctly', async ({ page }) => {
        await page.goto('/posts/hello-momei-test')
        const content = page.locator('.markdown-body')
        await expect(content).toBeVisible()
    })

    test('should show comment section', async ({ page }) => {
        await page.goto('/posts/hello-momei-test')
    })
})
