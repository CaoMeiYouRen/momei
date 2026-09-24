import { test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, expectPageScreenshot, waitForVisualStable } from './helpers/visual'

/**
 * 视觉回归基线：列表页（管理端文章列表 `/admin/posts`）。
 *
 * 覆盖迁移方案 §8.2 要求的「列表页 1 个（优先管理端主路径）」+ 浅色 / 深色两套主题。
 * 该页是 `<Column>` / DataTable 的最大消费面，也是 B2 试点批次的首要目标。
 */
test.describe('列表页：管理端文章列表', () => {
    for (const theme of VISUAL_THEMES) {
        test(`admin-posts-list-${theme}`, async ({ page }) => {
            await applyTheme(page, theme)
            await page.goto('/admin/posts')
            await waitForVisualStable(page)
            await page.getByRole('heading', { name: '文章管理' }).waitFor({ state: 'visible' })

            await expectPageScreenshot(page, `admin-posts-list-${theme}.png`)
        })
    }
})
