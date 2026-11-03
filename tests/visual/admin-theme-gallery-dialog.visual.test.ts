import { test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, expectLocatorScreenshot, waitForVisualStable } from './helpers/visual'

/**
 * 视觉回归基线：主题画廊弹窗（`/admin/settings/theme` → 主题画廊）。
 *
 * 列表响应在测试内固定 mock，避免依赖当前库状态；两张卡片覆盖「自定义 + 当前」与
 * 「系统 + 无预览图」两种形态，用于守住 `CaomeiCard` 的标题 / 标签 / 页脚布局。
 */
const GALLERY_PAYLOAD = {
    data: [
        {
            id: 'theme-visual-1',
            name: '深海主题',
            description: '深色自定义方案',
            isActive: true,
            isSystem: false,
            previewImage: '',
        },
        {
            id: 'theme-visual-2',
            name: '系统默认',
            description: '内置默认主题',
            isActive: false,
            isSystem: true,
            previewImage: '',
        },
    ],
}

test.describe('主题画廊弹窗', () => {
    for (const theme of VISUAL_THEMES) {
        test(`admin-theme-gallery-dialog-${theme}`, async ({ page }) => {
            await page.route('**/api/admin/theme-configs', async (route) => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(GALLERY_PAYLOAD),
                })
            })

            await applyTheme(page, theme)
            await page.goto('/admin/settings/theme')
            await waitForVisualStable(page)
            await page.getByRole('heading', { name: '主题定制' }).waitFor({ state: 'visible' })

            await page.getByRole('button', { name: '主题画廊' }).click()
            await page.locator('.theme-config-card').first().waitFor({ state: 'visible' })
            await waitForVisualStable(page)

            await expectLocatorScreenshot(page.locator('.theme-gallery-dialog'), `admin-theme-gallery-dialog-${theme}.png`)
        })
    }
})
