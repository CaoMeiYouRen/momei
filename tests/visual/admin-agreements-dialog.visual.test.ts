import { test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, expectLocatorScreenshot, waitForVisualStable } from './helpers/visual'

/**
 * 视觉回归基线：浮层（管理端系统设置 → 「协议管理」→「新增」→ 创建协议对话框）。
 *
 * 覆盖迁移方案 §8.2 要求的「浮层 1 个」+ 浅色 / 深色两套主题。
 * 浮层在 B3 / B4 批次迁移（Dialog / Drawer / Popover 类），此处先建立迁移前观感基线。
 */
test.describe('浮层：协议创建对话框', () => {
    for (const theme of VISUAL_THEMES) {
        test(`admin-agreements-dialog-${theme}`, async ({ page }) => {
            await applyTheme(page, theme)
            await page.goto('/admin/settings')
            await waitForVisualStable(page)

            await page.getByRole('tab', { name: '协议管理' }).click()
            await page.getByRole('tabpanel').getByRole('button', { name: '新增' }).first().click()

            const dialog = page.getByRole('dialog')
            await dialog.waitFor({ state: 'visible' })

            /* 协议表单内的 Markdown 编辑器是客户端懒加载组件（先渲染空壳、约 1s 后才挂编辑器），
             * 基线采集的是加载完成态；不等待会拍到空白编辑器并造成假红。 */
            await dialog.locator('.admin-markdown-editor .v-note-wrapper').waitFor({ state: 'visible', timeout: 15000 })
            await waitForVisualStable(page)

            await expectLocatorScreenshot(dialog, `admin-agreements-dialog-${theme}.png`)
        })
    }
})
