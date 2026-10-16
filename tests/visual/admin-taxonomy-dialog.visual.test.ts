import { expect, test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, expectLocatorScreenshot, waitForVisualStable } from './helpers/visual'

/**
 * 视觉回归基线：分类管理「新建分类」弹窗（多语言页签表单）。
 *
 * 覆盖边界说明：门禁层（`tests/visual/parity/`）对可比路由做整页比对，但**参考态不含数据行**时
 * 弹窗不会被打开，故 Tabs 族 / InputGroup / Checkbox / Textarea 这批「路由级在册族增量」的迁移
 * 在门禁层没有截图覆盖（见 `docs/reports/regression/current.md` 分类 / 标签路由窗口）。本用例补上该覆盖：
 * 打开弹窗并对浮层本体截图，浅色 / 深色两套主题各一张。
 *
 * 基线为**迁移后**当前观感（浮层本体迁移前，本快照用于捕捉弹窗内已迁移控件的回归）。
 */
test.describe('浮层：分类管理新建弹窗', () => {
    for (const theme of VISUAL_THEMES) {
        test(`admin-taxonomy-dialog-${theme}`, async ({ page }) => {
            await applyTheme(page, theme)
            await page.goto('/admin/categories')
            await waitForVisualStable(page)

            await page.locator('.admin-header__actions button').first().click()

            const dialog = page.getByRole('dialog')
            await dialog.waitFor({ state: 'visible' })

            /* 焦点交接断言（真实 DOM）：迁移前弹窗打开后焦点在名称输入框，迁移后需由
             * 「浮层首次 focusin 后交回当前语言页签名称字段」接管——桩用例无法覆盖真实时序。
             * 用轮询断言而非即时断言：交接发生在浮层进入过渡（PrimeVue `onAfterEnter` 的 focus trap）
             * 之后，即时读取会稳定读到「尚未交接」的中间态。 */
            await expect.poll(
                () => page.evaluate(() => document.activeElement?.id ?? ''),
                { message: '弹窗打开后焦点应落在名称输入框', timeout: 5000 },
            ).toMatch(/^name_/)

            await expectLocatorScreenshot(dialog, `admin-taxonomy-dialog-${theme}.png`)
        })
    }
})
