import { test, expect } from '@playwright/test'

test.describe('Post Reading E2E Tests', () => {
    test('should load post list page', async ({ page }) => {
        await page.goto('/posts')
        await page.waitForLoadState('networkidle')

        // 验证主容器可见
        await expect(page.locator('main')).toBeVisible()
    })

    test('should show post detail and common elements if post exists', async ({ page }) => {
        // 先去首页找第一个文章链接
        await page.goto('/')
        const firstPost = page.locator('a[href^="/posts/"]').first()

        if (await firstPost.count() > 0) {
            const postUrl = await firstPost.getAttribute('href')
            if (postUrl) {
                await page.goto(postUrl)
                await page.waitForLoadState('networkidle')

                // 1. 验证 Markdown 内容渲染器
                const content = page.locator('.markdown-body, .article-content')
                await expect(content.first()).toBeVisible()

                // 2. 验证 TOC
                const toc = page.locator('.toc, .table-of-contents')
                await page.waitForTimeout(1000)
                if (await toc.count() > 0) {
                    await expect(toc.first()).toBeVisible()
                }
            }
        }
    })
})
