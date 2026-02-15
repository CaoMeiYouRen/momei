import { test, expect, devices } from '@playwright/test'

test.use({ ...devices['iPhone 13'] })

test.describe('Responsive Design E2E Tests', () => {
    test('should show mobile menu on small screens', async ({ page }) => {
        await page.goto('/')
        // 等待页面完全加载
        await page.waitForLoadState('networkidle')

        // 桌面端导航应隐藏
        const desktopNav = page.locator('.app-header__nav.desktop-only')
        await expect(desktopNav).not.toBeVisible()

        // 移动端菜单按钮
        const menuBtn = page.locator('.app-header button:has([class*="pi-bars"])')
        await expect(menuBtn).toBeVisible()

        // 点击按钮
        await menuBtn.click()

        // 抽屉菜单应可见 (PrimeVue Drawer 组件)
        const drawer = page.locator('.p-drawer')
        await expect(drawer).toBeVisible({ timeout: 10000 })

        // 检查移动端导航链接 (Articles/文章)
        await expect(drawer.getByText(/Articles|文章/)).toBeVisible()
    })

    test.skip('should handle post reading on mobile', async ({ page }) => {
        // 需要数据库数据，待实现测试数据设置
        await page.goto('/posts/hello-momei-test')
    })
})
