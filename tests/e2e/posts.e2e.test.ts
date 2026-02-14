import { test, expect } from '@playwright/test'

test.describe('Post Reading E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
    })

    test('should find and navigate to the test post', async ({ page }) => {
        // 在首页查找测试文章链接
        const postLink = page.locator('text=Hello Momei Test')
        await expect(postLink.first()).toBeVisible()

        await postLink.first().click()

        // 验证 URL
        await expect(page).toHaveURL(/\/posts\/hello-momei-test/)

        // 验证标题
        await expect(page.locator('h1.post-detail__title')).toHaveText('Hello Momei Test')
    })

    test('should display Table of Contents and allow navigation', async ({ page }) => {
        await page.goto('/posts/hello-momei-test')

        const toc = page.locator('.table-of-contents')
        await expect(toc).toBeVisible()

        // 检查 TOC 项
        const tocItem = toc.locator('text=Section 1')
        await expect(tocItem).toBeVisible()

        // 点击 TOC 项并检查 URL hash (虽然 playwright 检查滚动比较麻烦，检查 hash 是个好办法)
        await tocItem.click()
        expect(page.url()).toContain('#section-1')
    })

    test('should render markdown content correctly', async ({ page }) => {
        await page.goto('/posts/hello-momei-test')

        const content = page.locator('.article-content')
        await expect(content).toBeVisible()

        // 检查 H2
        await expect(content.locator('h2').first()).toHaveText('Section 1')
    })

    test('should show comment section', async ({ page }) => {
        await page.goto('/posts/hello-momei-test')

        const commentSection = page.locator('.comment-list, .comment-form')
        // 视项目实现而定，如果没有评论可能只显示表单
        await expect(commentSection.first()).toBeVisible()
    })
})
