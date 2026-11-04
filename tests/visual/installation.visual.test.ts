import { expect, test } from '@playwright/test'
import { mockInstallationStatus } from './helpers/installation-fixture'
import { VISUAL_THEMES, applyTheme, expectPageScreenshot, waitForVisualStable } from './helpers/visual'

/**
 * 视觉回归基线：安装向导 `/installation`（未安装态实例）。
 *
 * 与 parity 层的分工：基线层锁定「迁移后的观感」，parity 层锁定「与迁移前参考态的偏差可归因」。
 * 两套实例配置同源（`MOMEI_INSTALLED=false` + `TEST_MODE=false` + 内存库），状态响应固定 mock，
 * 避免 node / OS / DB 版本进入截图。
 */
test.describe('安装向导', () => {
    for (const theme of VISUAL_THEMES) {
        test(`installation-wizard-${theme}`, async ({ page }) => {
            await mockInstallationStatus(page)
            await applyTheme(page, theme)
            await page.goto('/installation')
            await waitForVisualStable(page)

            await page.getByRole('heading', { name: '墨梅博客安装向导' }).waitFor({ state: 'visible' })
            await page.locator('.installation-wizard__checks-grid').waitFor({ state: 'visible' })

            /* 纯快照无法自证结构未坏：新增的 Stepper 族在窄容器里最容易出现标题溢出 / 标签撑高，
             * `CaomeiCard` 的 header flex 容器还会把标题压窄。这里补四条低成本断言，
             * 让「重采基线」掩盖不了这类失效。 */
            await expect(page.locator('.caomei-stepper__item')).toHaveCount(6)
            await expect(page.locator('.installation-wizard__setup-summary .caomei-tag')).toHaveCSS('height', '24px')

            const overflow = await page.locator('.installation-wizard__card').evaluate((card) => card.scrollWidth - card.clientWidth)
            expect(overflow).toBeLessThanOrEqual(1)

            /* 标题必须相对卡片居中：`CaomeiCard` 的 `#header` 外层是 flex 容器，
             * 页面 header 不放满会被压成内容宽度并左对齐（曾因此产生 248px 位移）。 */
            const titleOffset = await page.evaluate(() => {
                const card = document.querySelector('.installation-wizard__card') as HTMLElement
                const title = document.querySelector('.installation-wizard__title') as HTMLElement
                const cardRect = card.getBoundingClientRect()
                const titleRect = title.getBoundingClientRect()
                return Math.abs((titleRect.left + titleRect.width / 2) - (cardRect.left + cardRect.width / 2))
            })
            expect(titleOffset).toBeLessThanOrEqual(2)

            await expectPageScreenshot(page, `installation-wizard-${theme}.png`)
        })
    }
})
