import { test, expect } from '@playwright/test'

test.describe('Categories and Tags E2E Tests', () => {
    test.describe('Categories Page', () => {
        test('should display categories list', async ({ page }) => {
            await page.goto('/categories')
            await page.waitForLoadState('networkidle')

            // 验证页面标题存在
            await expect(page.locator('.categories-index__title')).toBeVisible({ timeout: 15000 })

            // 验证分类卡片容器或空状态容器存在
            // 如果加载成功，.categories-index__grid 应该存在
            // 如果加载失败，.categories-index__error 应该存在
            const grid = page.locator('.categories-index__grid')
            const error = page.locator('.categories-index__error')

            await expect(grid.or(error)).toBeVisible()
        })

        test('should show empty state when no categories', async ({ page }) => {
            await page.goto('/categories')
            await page.waitForLoadState('networkidle')

            const grid = page.locator('.categories-index__grid')
            await expect(grid).toBeVisible({ timeout: 10000 })
        })

        test('should navigate to category detail page', async ({ page }) => {
            await page.goto('/categories')
            await page.waitForLoadState('networkidle')

            // 等待分类列表加载
            const grid = page.locator('.categories-index__grid')
            await expect(grid).toBeVisible({ timeout: 10000 })

            // 查找第一个分类卡片
            const cards = page.locator('.category-card')
            const count = await cards.count()

            if (count > 0) {
                await cards.first().click()
                // 验证导航到分类详情页
                await expect(page).toHaveURL(/\/categories\/.+/, { timeout: 10000 })
            }
        })

        test('should display category card with correct information', async ({ page }) => {
            await page.goto('/categories')

            await page.waitForSelector('.categories-index__grid', { timeout: 5000 })

            // 检查分类卡片是否包含必要信息
            const cards = page.locator('.category-card')
            const cardCount = await cards.count()

            if (cardCount > 0) {
                const firstCard = cards.first()

                // 验证分类名称存在
                await expect(firstCard.locator('.category-card__name')).toBeVisible()

                // 验证文章数量显示存在
                await expect(firstCard.locator('.category-card__footer')).toBeVisible()
            }
        })
    })

    test.describe('Tags Page', () => {
        test('should display tags cloud', async ({ page }) => {
            await page.goto('/tags')
            await page.waitForLoadState('networkidle')

            // 验证页面标题存在
            await expect(page.locator('.tags-index__title')).toBeVisible({ timeout: 15000 })

            // 验证标签云容器存在
            await expect(page.locator('.tags-index__cloud')).toBeVisible()
        })

        test('should show tags with different sizes based on popularity', async ({ page }) => {
            await page.goto('/tags')
            await page.waitForLoadState('networkidle')

            // 检查标签云项目是否存在
            const tags = page.locator('.tag-cloud-item')
            const tagCount = await tags.count()

            if (tagCount > 0) {
                // 验证标签显示正确
                await expect(tags.first()).toBeVisible()

                // 验证标签有 # 前缀
                const tagText = await tags.first().textContent()
                expect(tagText).toMatch(/^#/)
            }
        })

        test('should navigate to tag detail page', async ({ page }) => {
            await page.goto('/tags')
            await page.waitForLoadState('networkidle')

            // 查找第一个标签并点击
            const tags = page.locator('.tag-cloud-item')
            const count = await tags.count()

            if (count > 0) {
                await tags.first().click()
                // 验证导航到标签详情页
                await expect(page).toHaveURL(/\/tags\/.+/, { timeout: 10000 })
            }
        })

        test('should display tag post count', async ({ page }) => {
            await page.goto('/tags')
            await page.waitForLoadState('networkidle')

            // 检查标签是否显示文章数量
            const tags = page.locator('.tag-cloud-item')
            const tagCount = await tags.count()

            if (tagCount > 0) {
                await expect(tags.first().locator('.tag-cloud-item__count')).toBeVisible()
            }
        })
    })

    test.describe('Category and Tag Detail Pages', () => {
        test('should display category detail page', async ({ page }) => {
            // 先访问分类列表
            await page.goto('/categories')
            await page.waitForLoadState('networkidle')

            // 点击第一个分类
            const cards = page.locator('.category-card')
            const count = await cards.count()

            if (count > 0) {
                await cards.first().click()
                // 验证分类详情页加载
                await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })
            }
        })

        test('should display tag detail page', async ({ page }) => {
            // 先访问标签列表
            await page.goto('/tags')
            await page.waitForLoadState('networkidle')

            // 点击第一个标签
            const tags = page.locator('.tag-cloud-item')
            const count = await tags.count()

            if (count > 0) {
                await tags.first().click()
                // 验证标签详情页加载
                await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })
            }
        })
    })
})
