import { test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, expectPageScreenshot, waitForVisualStable } from './helpers/visual'

/**
 * 视觉回归基线：列表页（管理端稿件审核 `/admin/submissions`）。
 *
 * 覆盖迁移方案 §8.2 的「列表页」层，作为 B2 剩余数据页迁移（第六十八阶段条目 2）首路由的观感守线面：
 * 该页覆盖 DataTable 列插槽 / 分页 / Tag / Button（含 0.6.0 `iconOnly`）/ InputText（`#prefix` 插槽）/
 * Select 与共享头部。按 M4 口径迁移前采集基线、迁移后逐项归因差异。
 *
 * 注：TEST_MODE 未播种稿件数据，故本页为空态渲染；表格行级结构由单元层用例覆盖。
 */
test.describe('列表页：管理端稿件审核', () => {
    for (const theme of VISUAL_THEMES) {
        test(`admin-submissions-list-${theme}`, async ({ page }) => {
            await applyTheme(page, theme)
            await page.goto('/admin/submissions')
            await waitForVisualStable(page)
            await page.getByRole('heading', { name: '稿件审核' }).waitFor({ state: 'visible' })

            await expectPageScreenshot(page, `admin-submissions-list-${theme}.png`)
        })
    }
})
