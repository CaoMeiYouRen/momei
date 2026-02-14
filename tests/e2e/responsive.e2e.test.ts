import { test, expect, devices } from '@playwright/test'

test.use({ ...devices['iPhone 13'] })

test.describe('Responsive Design E2E Tests', () => {
    test('should show mobile menu on small screens', async ({ page }) => {
        await page.goto('/')

        // 桌面端导航应隐藏
        const desktopNav = page.locator('.app-header__nav.desktop-only')
        await expect(desktopNav).not.toBeVisible()

        // 移动端菜单按钮应显示
        const menuBtn = page.locator('button:has(i.pi-bars)')
        await expect(menuBtn).toBeVisible()

        // 点击展开菜单
        await menuBtn.click()

        // 抽屉菜单应可见
        const drawer = page.locator('.mobile-drawer')
        await expect(drawer).toBeVisible()

        // 检查移动端导航链接
        await expect(drawer.locator('text=文章, text=Posts')).toBeVisible()
    })

    test('should handle post reading on mobile', async ({ page }) => {
        await page.goto('/posts/hello-momei-test')

        // 文章标题应可见
        await expect(page.locator('h1.post-detail__title')).toBeVisible()

        // 侧边栏 TOC 在移动端通常会被隐藏或放入折叠组件
        const sidebar = page.locator('.post-detail__sidebar')
        // 检查是否应用了隐藏样式或不在视口内
        // 根据 CSS 实现，可能 display: none
        // 这里只是示意
        const isSidebarVisible = await sidebar.isVisible()
        if (!isSidebarVisible) {
            // 检查是否有阅读控制或 TOC 按钮
            const readerControls = page.locator('.reader-controls')
            if (await readerControls.count() > 0) {
                await expect(readerControls).toBeVisible()
            }
        }
    })
})
