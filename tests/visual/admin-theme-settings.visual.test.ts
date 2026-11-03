import { test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, expectPageScreenshot, waitForVisualStable } from './helpers/visual'

/**
 * 视觉回归基线：主题工作台 `/admin/settings/theme`。
 *
 * 覆盖 `Panel` / `Tabs` 族 / `SelectButton` / `ColorPicker` / `Select` / `Switch` 的整页观感；
 * 色彩字段在 `ClientOnly` 内异步挂载（本地实测 4–5 秒），因此截图前显式等待首个字段可见。
 */
test.describe('主题工作台', () => {
    for (const theme of VISUAL_THEMES) {
        test(`admin-theme-settings-${theme}`, async ({ page }) => {
            await applyTheme(page, theme)
            await page.goto('/admin/settings/theme')
            await waitForVisualStable(page)
            await page.getByRole('heading', { name: '主题定制' }).waitFor({ state: 'visible' })
            await page.locator('.theme-color-field').first().waitFor({ state: 'visible', timeout: 15000 })

            await expectPageScreenshot(page, `admin-theme-settings-${theme}.png`)
        })
    }
})
