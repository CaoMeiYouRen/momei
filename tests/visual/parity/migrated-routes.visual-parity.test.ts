import { test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, waitForVisualStable } from '../helpers/visual'
import { MIGRATED_ROUTES } from './routes'
import { runVisualParity, waitForVisualStableLenient } from './helpers'

/**
 * 视觉一致性门禁：已迁移路由。
 *
 * 对每个已迁移到 caomei-ui 的路由，比较「当前渲染」与「迁移前 PrimeVue 参考态」的
 * 逐像素差异，并按 parity-budget.json 的分级预算与允许清单判定。
 *
 * 与 `pending-routes.visual-parity.test.ts` 共用同一套就绪口径：条目上的
 * `stable`（`lenient` = 该路由存在持续网络活动，放弃 `networkidle` 改有界稳定窗口）、
 * `readyResponse` / `readySelector`（异步数据就绪锚点）在此同样生效——
 * 迁移不改变路由的数据加载时序，故就绪契约必须随路由一起保留。
 *
 * 参考态采集（迁移前提交）：
 * - /admin/comments      → 44774147^
 * - /admin/submissions   → ff443447^
 * - /admin/external-links→ 04d12c17^
 * 命令：pnpm test:visual:reference -- --ref=<ref> --only=<route-name>
 */
test.describe('视觉一致性门禁：已迁移路由', () => {
    for (const route of MIGRATED_ROUTES) {
        for (const theme of VISUAL_THEMES) {
            test(`${route.name}-${theme}`, async ({ page }, testInfo) => {
                await applyTheme(page, theme)

                /* 在导航前登记就绪锚点，避免与首个异步数据请求竞态（请求可能早于稳定等待完成）。 */
                const readyResponse = route.readyResponse
                    ? page.waitForResponse(
                        (response) => response.url().includes(route.readyResponse as string),
                        { timeout: 20000 },
                    ).catch(() => null)
                    : null

                await page.goto(route.path)
                if (route.stable === 'lenient') {
                    await waitForVisualStableLenient(page)
                } else {
                    await waitForVisualStable(page)
                }

                await readyResponse
                if (route.readySelector) {
                    /* 数据行缺失（如空列表）时按有界超时放弃，不阻断截图。 */
                    await page.locator(route.readySelector).first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined)
                }

                await page.getByRole('heading', { name: route.heading }).waitFor({ state: 'visible' })

                await runVisualParity(page, { name: `${route.name}-${theme}`, testInfo })
            })
        }
    }
})
