import { devices, expect, test } from '@playwright/test'
import { waitForHydration } from './helpers/mobile-e2e'

test.use({ ...devices['iPhone 13'] })

test.describe('移动端列表与信息密度', () => {
    test('should keep list and taxonomy pages readable at 360px', async ({ page }) => {
        const routes = ['/', '/posts', '/categories', '/tags', '/archives', '/friend-links']
        await page.setViewportSize({ width: 360, height: 800 })

        for (const route of routes) {
            await page.goto(route, { waitUntil: 'domcontentloaded' })
            await waitForHydration(page)
            await page.waitForTimeout(200)

            const metrics = await page.evaluate(() => ({
                innerWidth: window.innerWidth,
                scrollWidth: document.documentElement.scrollWidth,
            }))
            expect(metrics.scrollWidth, `${route} 出现页面级横向滚动`).toBeLessThanOrEqual(metrics.innerWidth)
        }

        await page.goto('/posts', { waitUntil: 'domcontentloaded' })
        await page.getByRole('heading', { name: '文章列表', exact: true }).first().waitFor({ state: 'visible' })
        const card = page.locator('.article-card').first()
        await expect(card.locator('.article-card__title')).toBeVisible()
        const clamp = await card.locator('.article-card__title').evaluate((element) => getComputedStyle(element).webkitLineClamp)
        expect(clamp).toBe('2')
    })
})
