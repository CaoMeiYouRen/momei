import { expect, test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, waitForVisualStable } from '../helpers/visual'
import { PENDING_ROUTES } from './routes'
import { runVisualParity, waitForVisualStableLenient } from './helpers'

/**
 * 视觉一致性门禁：待迁移路由。
 *
 * **本文件当前不产出用例**（`PENDING_ROUTES` 为空）：组件型目标各批次完成后（分类 / 标签 → 首路由批次；`/admin/ai` → 第二批次；
 * `/admin/marketing` → 第三批次），对应条目已移入 `MIGRATED_ROUTES`，待迁移层回到空集。文件与其中的就绪口径
 * （`stable` / `readyResponse` / `readySelector` / `activate`）保留为**后续批次的模板**（见 `docs/plan/todo.md`）：
 * 新增待迁移路由时在此登记，即自动获得与已迁移层同口径的比对。
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

                /* 需要对照默认页签之外的分区时，先按可访问角色激活目标页签再截图
                 * （同一准备逻辑对「参考态采集」与「当前态比对」一致生效）。 */
                if (route.activate) {
                    /* 点击 → 断言目标状态后再截图：SSR 首屏可见但未水合时单次点击会静默失效
                     * （E2E 侧同类竞态改用 `toPass` 重试），故此处同样用有界重试，避免偶发假失败
                     * 或截到默认视图。页签断言 `aria-selected`；`expect` 给出弹窗等目标锚点。 */
                    const target = page.getByRole(route.activate.role, { name: route.activate.name })
                    const expectation = route.activate.expect

                    await expect(async () => {
                        await target.click()
                        if (route.activate?.role === 'tab') {
                            await expect(target).toHaveAttribute('aria-selected', 'true', { timeout: 2000 })
                        }
                        if (expectation) {
                            await expect(page.locator(expectation)).toBeVisible({ timeout: 3000 })
                        }
                    }).toPass({ timeout: 15000 })

                    if (route.stable === 'lenient') {
                        await waitForVisualStableLenient(page)
                    } else {
                        await waitForVisualStable(page)
                    }
                }
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
