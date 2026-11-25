import { expect, test } from '@playwright/test'
import { MOBILE_READING_FIXTURE_HTML } from '../../helpers/mobile-reading-fixture'
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

/**
 * 阅读页夹具视觉守卫：把宽表 / 长 URL / 长行内代码 / 复制按钮注入正文后，
 * 对夹具容器整体截图（元素级，覆盖折叠线以下内容）。
 */
test.describe('移动端阅读页夹具', () => {
    for (const theme of VISUAL_THEMES) {
        const name = `mobile-post-rich-${theme}`
        const entry = getMobileBudgetEntry(name, budgetFile)

        test(name, async ({ page }, testInfo) => {
            const report = {
                name,
                route: '/posts/hello-momei-test',
                theme,
                tier: entry.tier,
                budget: { maxDiffPixels: entry.maxDiffPixels },
                outputDir: testInfo.outputDir,
            }

            try {
                await applyTheme(page, theme)
                await blockExternalRequests(page)
                await page.goto('/posts/hello-momei-test', { waitUntil: 'domcontentloaded' })
                await waitForMobileStable(page, { lenient: true })
                await page.getByRole('heading', { name: 'Hello Momei Test', exact: true }).first().waitFor({ state: 'visible' })

                /* 夹具挂在正文容器之外（复用 `.markdown-body` 样式），避免水合 / 阅读量自增的
                 * 重渲染覆盖注入内容；元素级截图覆盖折叠线以下的全部夹具内容。 */
                await page.evaluate((html) => {
                    document.querySelector('#reading-fixture-host')?.remove()
                    const host = document.createElement('div')
                    host.id = 'reading-fixture-host'
                    host.className = 'markdown-body'
                    host.style.padding = '0 1rem'
                    host.style.backgroundColor = 'var(--caomei-color-bg)'
                    host.innerHTML = html
                    document.body.appendChild(host)
                }, MOBILE_READING_FIXTURE_HTML)

                const fixture = page.locator('#reading-fixture-host')
                await expect(fixture).toBeVisible()

                await expect(fixture).toHaveScreenshot(`${name}.png`, {
                    /* 固定悬浮入口（反馈 / 阅读控制）会随视口叠在夹具上，与夹具内容无关，一并遮蔽。 */
                    mask: [...mobileMask(page), page.locator('.feedback-entry-button'), page.locator('.reader-controls')],
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
})
