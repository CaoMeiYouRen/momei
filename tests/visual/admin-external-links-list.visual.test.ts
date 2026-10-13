import { test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, expectPageScreenshot, waitForVisualStable } from './helpers/visual'

/**
 * 视觉回归基线：列表页（管理端外链管理 `/admin/external-links`）。
 *
 * 覆盖迁移方案 §8.2 的「列表页」层，作为 B2 剩余数据页迁移（第六十八阶段条目 2）第二路由的观感守线面：
 * 该页覆盖 DataTable 列插槽 / 客户端分页 / Tag / Button（含 0.6.0 `iconOnly`）/ InputText（`CaomeiInput`）/
 * Select（`CaomeiSelect`）与共享头部。按 M4 口径迁移前采集基线、迁移后逐项归因差异。
 *
 * 注：TEST_MODE 未播种外链数据，故本页为空态渲染；表格行级结构由单元层用例覆盖。
 */
test.describe('列表页：管理端外链管理', () => {
    for (const theme of VISUAL_THEMES) {
        test(`admin-external-links-list-${theme}`, async ({ page }) => {
            await applyTheme(page, theme)
            await page.goto('/admin/external-links')
            await waitForVisualStable(page)
            await page.getByRole('heading', { name: '外链管理' }).waitFor({ state: 'visible' })

            await expectPageScreenshot(page, `admin-external-links-list-${theme}.png`)
        })
    }
})
