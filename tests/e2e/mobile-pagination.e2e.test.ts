import { devices, expect, test } from '@playwright/test'
import { waitForHydration } from './helpers/mobile-e2e'

test.use({ ...devices['iPhone 13'], storageState: 'tests/e2e/.auth/admin.json' })

/**
 * 分页交互的真实数据验证。
 *
 * TEST_MODE 种子只有 1 篇文章，`totalPages=1` 时列表不渲染分页器。这里通过管理端 API
 * 临时创建足量文章，验证分页控件出现、触控尺寸达标、点击后 URL 与列表内容变化，
 * 结束后逐个删除，避免污染同一 shard 的其他 E2E。
 *
 * 注意：本地并发运行其他 spec 时需 `--workers=1`（CI 默认即为 1）。
 */
const createdIds: string[] = []
const postCount = 12

test.describe.serial('移动端列表分页', () => {
    test.beforeAll(async ({ playwright, baseURL }) => {
        const api = await playwright.request.newContext({
            baseURL,
            storageState: 'tests/e2e/.auth/admin.json',
        })

        try {
            for (let index = 0; index < postCount; index++) {
                const response = await api.post('/api/posts', {
                    data: {
                        title: `分页测试文章 ${index + 1}`,
                        slug: `pagination-fixture-${Date.now()}-${index}`,
                        content: `# 分页测试 ${index + 1}\n\n用于验证移动端分页交互的临时文章。`,
                        summary: '分页测试临时数据',
                        status: 'published',
                        visibility: 'public',
                        language: 'zh-CN',
                        publishedAt: new Date().toISOString(),
                    },
                })
                expect(response.ok(), `创建测试文章失败：${await response.text()}`).toBe(true)
                const body = await response.json() as { data?: { id?: string } }
                if (body.data?.id) {
                    createdIds.push(body.data.id)
                }
            }
        } finally {
            await api.dispose()
        }

        expect(createdIds).toHaveLength(postCount)
    })

    test.afterAll(async ({ playwright, baseURL }) => {
        const api = await playwright.request.newContext({
            baseURL,
            storageState: 'tests/e2e/.auth/admin.json',
        })

        try {
            for (const id of createdIds) {
                const response = await api.delete(`/api/posts/${id}`)
                expect(response.ok(), `清理测试文章失败：${id}`).toBe(true)
            }
        } finally {
            await api.dispose()
        }
    })

    test('should render a clickable 44px paginator and switch pages', async ({ page }) => {
        await page.goto('/posts')
        await waitForHydration(page)
        await page.getByRole('heading', { name: '文章列表', exact: true }).first().waitFor({ state: 'visible' })

        const paginator = page.locator('.caomei-paginator')
        await expect(paginator).toBeVisible()

        const pageTwo = paginator.locator('.caomei-paginator__item').filter({ hasText: /^2$/u }).first()
        await expect(pageTwo).toBeVisible()
        const box = await pageTwo.boundingBox()
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)

        const firstTitle = await page.locator('.article-card__title').first().textContent()
        await pageTwo.click()

        await expect.poll(async () => page.url()).toContain('page=2')
        await expect(page.locator('.article-card__title').first()).not.toHaveText(firstTitle ?? '')
    })
})
