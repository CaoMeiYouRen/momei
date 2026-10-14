import { test } from '@playwright/test'
import { VISUAL_THEMES, applyTheme, waitForVisualStable } from '../helpers/visual'
import { MIGRATED_ROUTES } from './routes'
import { runVisualParity } from './helpers'

/**
 * 视觉一致性门禁：已迁移路由。
 *
 * 对每个已迁移到 caomei-ui 的路由，比较「当前渲染」与「迁移前 PrimeVue 参考态」的
 * 逐像素差异，并按 parity-budget.json 的分级预算与允许清单判定。
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
                await page.goto(route.path)
                await waitForVisualStable(page)
                await page.getByRole('heading', { name: route.heading }).waitFor({ state: 'visible' })

                await runVisualParity(page, { name: `${route.name}-${theme}`, testInfo })
            })
        }
    }
})
