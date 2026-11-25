import { expect, test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme } from '../helpers/visual'
import { mobileMask, blockExternalRequests, waitForMobileStable } from './helpers'
import { MOBILE_READER_ROUTES } from './reader.routes'

/**
 * 移动端公开页视觉基线（390×844 / DPR 3）。
 *
 * 覆盖 12 条 reader 路由 × 明暗两套主题。与桌面基线层同口径：
 * - 只截视口首屏（默认 `fullPage: false`），避免长页面高度随数据变化；
 * - 动态区域一律遮蔽，不靠容差兜底（口径见 `./helpers.ts`）。
 */
test.describe('移动端公开页视觉基线', () => {
    for (const route of MOBILE_READER_ROUTES) {
        for (const theme of VISUAL_THEMES) {
            test(`${route.name}-${theme}`, async ({ page }) => {
                await applyTheme(page, theme)
                await blockExternalRequests(page)
                await page.goto(route.path, route.gotoWaitUntil ? { waitUntil: route.gotoWaitUntil } : undefined)

                await waitForMobileStable(page, { lenient: route.stable === 'lenient' })

                /* 就绪按标题锚点判定：页面错误态 / 骨架屏会因缺少标题而响亮失败，
                 * 而不是把错误页当作基线截下来。 */
                await page.getByRole('heading', { name: route.heading, exact: true }).first().waitFor({ state: 'visible' })

                await expect(page).toHaveScreenshot(`${route.name}-${theme}.png`, {
                    mask: mobileMask(page),
                })
            })
        }
    }
})
