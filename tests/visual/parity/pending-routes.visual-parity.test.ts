import { expect, test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, waitForVisualStable } from '../helpers/visual'
import { PENDING_ROUTES } from './routes'
import { runVisualParity, waitForVisualStableLenient } from './helpers'

/**
 * 视觉一致性门禁：待迁移路由。
 *
 * `PENDING_ROUTES` 当前登记 B4 未迁移面（管理端 2 条 + 公开页 12 条，共 28 条用例），
 * 参考态取自当前渲染（HEAD，PrimeVue 原貌）。
 *
 * 迁移到 caomei-ui 后把条目移入 `MIGRATED_ROUTES`、保持参考态不变，本文件中的用例
 * 会立即反映「与迁移前原貌」的偏差，从而强制逐项归因后才允许放行。
 * 就绪口径（`stable` / `gotoWaitUntil` / `readyResponse` / `readySelector` / `activate`）
 * 在 pending / migrated / installation 三处通用，新增路由时按需声明。
 *
 * 参考态采集命令：pnpm test:visual:reference（默认对 HEAD 全量采集；无待采目标时按成功退出）。
 */
test.describe('视觉一致性门禁：待迁移路由', () => {
    /* 安装向导类路由由独立 project（第二 webServer）承载，本文件排除。 */
    for (const route of PENDING_ROUTES.filter((item) => item.server !== 'installation')) {
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

                await page.goto(route.path, route.gotoWaitUntil ? { waitUntil: route.gotoWaitUntil } : undefined)
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

                /* 保留 .first()：精确同名时（如文章 h1 与另一卡片标题）取 DOM 更靠前者。 */

                /* 保留 .first()：精确同名时（如文章 h1 与另一卡片标题）取 DOM 更靠前者。 */
                await page.getByRole('heading', { name: route.heading, exact: true }).first().waitFor({ state: 'visible' })

                await runVisualParity(page, { name: `${route.name}-${theme}`, testInfo, tier: route.tier })
            })
        }
    }
})
