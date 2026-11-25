import { expect, test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme } from '../helpers/visual'
import { getMobileBudgetEntry, readMobileBudget } from './budget'
import { blockExternalRequests, mobileMask, waitForMobileStable, writeMobileReport } from './helpers'
import { MOBILE_READER_ROUTES } from './reader.routes'

/**
 * 移动端公开页视觉基线（390×844 / DPR 3）。
 *
 * 覆盖 12 条 reader 路由 × 明暗两套主题。与桌面基线层同口径：
 * - 只截视口首屏（默认 `fullPage: false`），避免长页面高度随数据变化；
 * - 动态区域一律遮蔽，不靠容差兜底（口径见 `./helpers.ts`）；
 * - 阈值按路由分档，读取 `./parity-budget.json`（未登记即失败），失败时按
 *   `test-results/visual-mobile/report/<name>.json` 与 `*-diff.png` 定位路由与区域。
 */
const budgetFile = readMobileBudget()

test.describe('移动端公开页视觉基线', () => {
    for (const route of MOBILE_READER_ROUTES) {
        for (const theme of VISUAL_THEMES) {
            const name = `${route.name}-${theme}`
            const entry = getMobileBudgetEntry(name, budgetFile)

            test(name, async ({ page }, testInfo) => {
                const report = {
                    name,
                    route: route.path,
                    theme,
                    tier: entry.tier,
                    budget: { maxDiffPixels: entry.maxDiffPixels },
                    outputDir: testInfo.outputDir,
                }

                try {
                    await applyTheme(page, theme)
                    await blockExternalRequests(page)
                    await page.goto(route.path, route.gotoWaitUntil ? { waitUntil: route.gotoWaitUntil } : undefined)

                    await waitForMobileStable(page, { lenient: route.stable === 'lenient' })

                    /* 就绪按标题锚点判定：页面错误态 / 骨架屏会因缺少标题而响亮失败，
                     * 而不是把错误页当作基线截下来。 */
                    await page.getByRole('heading', { name: route.heading, exact: true }).first().waitFor({ state: 'visible' })

                    await expect(page).toHaveScreenshot(`${name}.png`, {
                        mask: mobileMask(page),
                        maxDiffPixels: entry.maxDiffPixels,
                        threshold: budgetFile.meta.pixelThreshold,
                    })
                    writeMobileReport({ ...report, status: 'pass' })
                } catch (error) {
                    writeMobileReport({
                        ...report,
                        status: 'fail',
                        error: error instanceof Error ? error.message.slice(0, 2000) : String(error),
                    })
                    throw error
                }
            })
        }
    }
})
