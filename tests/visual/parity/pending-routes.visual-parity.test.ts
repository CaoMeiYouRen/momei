import { test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, waitForVisualStable } from '../helpers/visual'
import { PENDING_ROUTES } from './routes'
import { runVisualParity, waitForVisualStableLenient } from './helpers'

/**
 * 视觉一致性门禁：待迁移路由。
 *
 * **本文件当前不产出用例**：条目 2 收口后 `PENDING_ROUTES` 为空（10 条 admin
 * 数据列表路由全部迁移）。文件与其中的就绪口径（`stable` / `readyResponse` / `readySelector`）
 * 保留为**后续批次的模板**——B3（设置族）与条目 3（组件型目标 host 路由）新增待迁移路由时，
 * 在此登记即自动获得与已迁移层同口径的比对。
 *
 * 待迁移层的语义：这些路由当前仍是 PrimeVue 实现，参考态即当前 PrimeVue 渲染（HEAD 采集）；
 * 待其迁移到 caomei-ui 后，本文件中的用例会立即反映「与迁移前原貌」的偏差，
 * 从而强制逐项归因（token 覆盖 / 预设 / 包装覆盖 / 上游反馈）后才允许放行。
 *
 * 参考态采集命令：pnpm test:visual:reference（默认对 HEAD 全量采集；无待采目标时按成功退出）。
 */
test.describe('视觉一致性门禁：待迁移路由', () => {
    for (const route of PENDING_ROUTES) {
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
