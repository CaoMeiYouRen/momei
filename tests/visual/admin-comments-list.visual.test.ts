import { test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, expectPageScreenshot, waitForVisualStable } from './helpers/visual'

/**
 * 视觉回归基线：列表页（管理端评论列表 `/admin/comments`）。
 *
 * 覆盖迁移方案 §8.2 的「列表页」层，并作为 B2 试点页（第六十七阶段第 4 项）的观感守线面：
 * 该页覆盖 DataTable / Column 列插槽 / 分页 / Tag / Button / InputText / Select 与共享头部，
 * 迁移前采集基线、迁移后逐项归因差异。
 *
 * 注：TEST_MODE 未播种评论数据，故本页为空态渲染；表格行级结构由单元层用例覆盖。
 */
test.describe('列表页：管理端评论列表', () => {
    for (const theme of VISUAL_THEMES) {
        test(`admin-comments-list-${theme}`, async ({ page }) => {
            await applyTheme(page, theme)
            await page.goto('/admin/comments')
            await waitForVisualStable(page)
            await page.getByRole('heading', { name: '评论管理' }).waitFor({ state: 'visible' })

            await expectPageScreenshot(page, `admin-comments-list-${theme}.png`)
        })
    }
})
