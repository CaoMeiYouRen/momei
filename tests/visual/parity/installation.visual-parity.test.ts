import { expect, test } from '@playwright/test'
import { mockInstallationStatus } from '../helpers/installation-fixture'
import { VISUAL_THEMES, applyTheme, waitForVisualStable } from '../helpers/visual'
import { MIGRATED_ROUTES, PENDING_ROUTES } from './routes'
import { runVisualParity } from './helpers'

/**
 * 视觉一致性门禁：安装向导（未安装态 server）。
 *
 * 为什么单独成文件：`/installation` 在已安装态由服务端直接 302 到首页
 * （`server/middleware/0-installation.ts`），前端 `page.route` 无法补救；因此该路由必须运行在
 * `MOMEI_INSTALLED=false` 的第二 webServer 上（端口 3002，见 `playwright.visual-parity.config.ts`），
 * 并由独立 project 通过 `testMatch` 只匹配本文件。
 *
 * 状态响应在测试内**固定 mock**：真实 `/api/install/status` 会返回机器相关字段
 * （node / OS / DB 版本）与真实安装态，一旦 DB 已安装，客户端会 `navigateTo('/')` 形成重定向；
 * 固定 payload 让「参考态采集」与「当前态比对」渲染同一份数据，差异只可能来自组件迁移。
 *
 * 参考态采集：`pnpm test:visual:reference -- --only=installation-wizard`（HEAD 就地采集）。
 */
const INSTALLATION_ROUTES = [...MIGRATED_ROUTES, ...PENDING_ROUTES].filter(
    (route) => route.server === 'installation',
)

test.describe('视觉一致性门禁：安装向导（未安装态 server）', () => {
    for (const route of INSTALLATION_ROUTES) {
        for (const theme of VISUAL_THEMES) {
            test(`${route.name}-${theme}`, async ({ page }, testInfo) => {
                await mockInstallationStatus(page)
                await applyTheme(page, theme)
                await page.goto(route.path, route.gotoWaitUntil ? { waitUntil: route.gotoWaitUntil } : undefined)
                await waitForVisualStable(page)

                /* 保留 .first()：精确同名时（如文章 h1 与另一卡片标题）取 DOM 更靠前者。 */

                /* 保留 .first()：精确同名时（如文章 h1 与另一卡片标题）取 DOM 更靠前者。 */
                await page.getByRole('heading', { name: route.heading, exact: true }).first().waitFor({ state: 'visible' })

                await runVisualParity(page, {
                    name: `${route.name}-${theme}`,
                    testInfo,
                    tier: route.tier,
                })
            })
        }
    }
})

test.describe('安装向导路由登记', () => {
    test('至少登记一条 installation server 路由', () => {
        /* 若该清单被清空（例如路由迁入已完成批次却漏改 server 标记），本文件会静默零用例，
         * 使安装向导失去像素门禁；此处用显式断言让该退化响亮失败。 */
        expect(INSTALLATION_ROUTES.length).toBeGreaterThan(0)
    })
})
