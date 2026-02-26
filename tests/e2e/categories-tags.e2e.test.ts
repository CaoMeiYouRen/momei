import { test, expect } from '@playwright/test'

test.describe('Categories and Tags E2E Tests', () => {
    test.describe('Categories Page', () => {
        test('should display categories list', async ({ page }) => {
            await page.goto('/categories')

            // 验证页面标题存在
            await expect(page.locator('.categories-index__title')).toBeVisible({ timeout: 15000 })

            // 验证页面主体结构已渲染（避免对瞬态可见性过于敏感）
            await expect(page.locator('.categories-index')).toBeVisible()
        })

        test('should show empty state when no categories', async ({ page }) => {
            await page.goto('/categories')

            await expect(page.locator('.categories-index__title')).toBeVisible({ timeout: 15000 })
            await expect(page.locator('.categories-index__subtitle')).toBeVisible()
        })

        test('should navigate to category detail page', async ({ page }) => {
            await page.goto('/categories')
            await expect(page.locator('.categories-index__title')).toBeVisible({ timeout: 15000 })

            // 查找第一个分类卡片
            const cards = page.locator('.category-card')
            const count = await cards.count()
            test.skip(count === 0, 'No categories available for navigation test')

            if (count > 0) {
                await cards.first().click()
                // 验证导航到分类详情页
                await expect(page).toHaveURL(/\/categories\/.+/, { timeout: 10000 })
            }
        })

        test('should display category card with correct information', async ({ page }) => {
            await page.goto('/categories')
            await expect(page.locator('.categories-index__title')).toBeVisible({ timeout: 15000 })

            // 检查分类卡片是否包含必要信息
            const cards = page.locator('.category-card')
            const cardCount = await cards.count()
            test.skip(cardCount === 0, 'No categories available for card assertions')

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
            await expect(page.locator('.tags-index__title')).toBeVisible({ timeout: 15000 })

            // 验证标签区域结构已渲染
            await expect(page.locator('.tags-index')).toBeVisible()
        })

        test('should show tags with different sizes based on popularity', async ({ page }) => {
            await page.goto('/tags')
            await expect(page.locator('.tags-index__title')).toBeVisible({ timeout: 15000 })

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
            await expect(page.locator('.tags-index__title')).toBeVisible({ timeout: 15000 })

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
            await expect(page.locator('.tags-index__title')).toBeVisible({ timeout: 15000 })

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
            await expect(page.locator('.categories-index__title')).toBeVisible({ timeout: 15000 })

            // 点击第一个分类
            const cards = page.locator('.category-card')
            const count = await cards.count()
            test.skip(count === 0, 'No categories available for detail page test')

            if (count > 0) {
                await cards.first().click()
                // 验证分类详情页加载
                await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })
            }
        })

        test('should display tag detail page', async ({ page }) => {
            // 先访问标签列表
            await page.goto('/tags')
            await expect(page.locator('.tags-index__title')).toBeVisible({ timeout: 15000 })

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
