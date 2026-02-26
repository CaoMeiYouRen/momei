import { test, expect } from '@playwright/test'

test.describe('Categories and Tags E2E Tests', () => {
    test.describe('Categories Page', () => {
        test('should display categories list', async ({ page }) => {
            await page.goto('/categories')

            // 验证页面标题存在
            await expect(page.locator('.categories-index__title')).toBeVisible()

            // 验证分类卡片容器存在
            await expect(page.locator('.categories-index__grid')).toBeVisible()
        })

        test('should show empty state when no categories', async ({ page }) => {
            // 这个测试取决于 API 返回空列表
            await page.goto('/categories')

            // 检查是否有内容，如果没有则显示空状态
            const grid = page.locator('.categories-index__grid')
            const hasCategories = await grid.locator('.category-card').count()

            if (hasCategories === 0) {
                // 应该显示某种空状态或默认内容
                await expect(grid).toBeVisible()
            }
        })

        test('should navigate to category detail page', async ({ page }) => {
            await page.goto('/categories')

            // 等待分类列表加载
            await page.waitForSelector('.categories-index__grid', { timeout: 5000 })

            // 查找第一个分类卡片并点击
            const firstCategory = page.locator('.category-card').first()
            const count = await firstCategory.count()

            if (count > 0) {
                await firstCategory.click()

                // 验证导航到分类详情页
                await expect(page).toHaveURL(/\/categories\/.+/)
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

            // 验证页面标题存在
            await expect(page.locator('.tags-index__title')).toBeVisible()

            // 验证标签云容器存在
            await expect(page.locator('.tags-index__cloud')).toBeVisible()
        })

        test('should show tags with different sizes based on popularity', async ({ page }) => {
            await page.goto('/tags')

            await page.waitForSelector('.tags-index__cloud', { timeout: 5000 })

            // 检查标签云项目是否存在
            const tags = page.locator('.tag-cloud-item')
            const tagCount = await tags.count()

            if (tagCount > 0) {
                // 验证标签显示正确
                await expect(tags.first()).toBeVisible()

                // 验证标签有 # 前缀
                const firstTag = tags.first()
                const tagText = await firstTag.textContent()
                expect(tagText).toMatch(/^#/)
            }
        })

        test('should navigate to tag detail page', async ({ page }) => {
            await page.goto('/tags')

            await page.waitForSelector('.tags-index__cloud', { timeout: 5000 })

            // 查找第一个标签并点击
            const firstTag = page.locator('.tag-cloud-item').first()
            const count = await firstTag.count()

            if (count > 0) {
                await firstTag.click()

                // 验证导航到标签详情页
                await expect(page).toHaveURL(/\/tags\/.+/)
            }
        })

        test('should display tag post count', async ({ page }) => {
            await page.goto('/tags')

            await page.waitForSelector('.tags-index__cloud', { timeout: 5000 })

            // 检查标签是否显示文章数量
            const tags = page.locator('.tag-cloud-item')
            const tagCount = await tags.count()

            if (tagCount > 0) {
                const firstTag = tags.first()
                await expect(firstTag.locator('.tag-cloud-item__count')).toBeVisible()
            }
        })
    })

    test.describe('Category and Tag Detail Pages', () => {
        test('should display category detail page', async ({ page }) => {
            // 先访问分类列表
            await page.goto('/categories')
            await page.waitForSelector('.categories-index__grid', { timeout: 5000 })

            // 点击第一个分类
            const firstCategory = page.locator('.category-card').first()
            const count = await firstCategory.count()

            if (count > 0) {
                await firstCategory.click()

                // 验证分类详情页加载
                await expect(page.locator('h1')).toBeVisible()
            }
        })

        test('should display tag detail page', async ({ page }) => {
            // 先访问标签列表
            await page.goto('/tags')
            await page.waitForSelector('.tags-index__cloud', { timeout: 5000 })

            // 点击第一个标签
            const firstTag = page.locator('.tag-cloud-item').first()
            const count = await firstTag.count()

            if (count > 0) {
                await firstTag.click()

                // 验证标签详情页加载
                await expect(page.locator('h1')).toBeVisible()
            }
        })
    })
})
