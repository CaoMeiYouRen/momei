import { test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, expectPageScreenshot, waitForVisualStable } from './helpers/visual'

/**
 * 视觉回归基线：表单 / 设置页（管理端系统设置 `/admin/settings` 默认「常规」标签页）。
 *
 * 覆盖迁移方案 §8.2 要求的「表单 / 设置页 1 个」+ 浅色 / 深色两套主题。
 * 该页聚合大量 InputText / Select / ToggleSwitch 等表单控件，是表单类组件迁移的观感守线面。
 */
test.describe('表单页：管理端系统设置', () => {
    for (const theme of VISUAL_THEMES) {
        test(`admin-settings-form-${theme}`, async ({ page }) => {
            await applyTheme(page, theme)
            await page.goto('/admin/settings')
            await waitForVisualStable(page)
            await page.getByRole('heading', { name: '系统设置' }).waitFor({ state: 'visible' })

            await expectPageScreenshot(page, `admin-settings-form-${theme}.png`)
        })
    }
})
