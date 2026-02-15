import { test, expect } from '@playwright/test'

test.describe('Installation Flow', () => {
    test('should show installation page or redirect if already installed', async ({ page }) => {
        await page.goto('/installation')
        await page.waitForLoadState('networkidle')

        const currentUrl = page.url()
        if (currentUrl.includes('/installation')) {
            // 验证安装页面的核心元素
            // 假设安装页面有数据库配置和管理员设置
            const dbConfig = page.locator('text=数据库, text=Database')
            await expect(dbConfig.first()).toBeVisible()

            const nextButton = page.locator('button:has-text("下一步"), button:has-text("Next")')
            await expect(nextButton).toBeVisible()
        } else {
            // 已经被重定向，说明已安装，测试也可以认为是通过的（不可达测试）
            console.info('Already installed, redirected to:', currentUrl)
        }
    })
})
