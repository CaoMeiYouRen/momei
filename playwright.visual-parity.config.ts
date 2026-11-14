import { defineConfig, devices } from '@playwright/test'
import { buildInstallationServerCommand, defaultAuthSecret, e2eHost as visualHost, e2ePort as visualPort, installationBaseURL } from './tests/helpers/playwright-servers'

/**
 * 视觉一致性门禁（visual parity gate）独立工程配置。
 *
 * 与 `playwright.visual.config.ts`（迁移基线层）职责不同、产物隔离：
 * - 基线层：`tests/visual/*.visual.test.ts`，用 Playwright 自带快照机制对比「本仓库
 *   自行提交的基线」；
 * - 门禁层：`tests/visual/parity/*.visual-parity.test.ts`，用「迁移前 PrimeVue 参考态」
 *   快照对比当前渲染，并按 `tests/visual/parity-budget.json` 的分级预算 + 允许清单判定。
 *
 * 独立入口：
 * - `pnpm test:visual:parity`       比对参考态（CI / Review Gate 用）
 * - `pnpm test:visual:reference`    采集参考态（`--update-snapshots`）
 *
 * 环境可复现纪律与基线层一致：固定浏览器渠道（chromium）、1440×900、DSF1、zh-CN、
 * Asia/Shanghai、关闭动画、隐藏光标；动态区域统一以 `[data-visual-mask]` 遮蔽。
 *
 * 依据见 docs/standards/testing.md §7.2 与
 * docs/design/governance/2026-10-13-visual-parity-gate.md。
 */

const visualBaseURL = `http://${visualHost}:${visualPort}`
const visualAuthSecret = defaultAuthSecret

// 与 playwright.visual.config.ts 的 webServer 保持一致（同一构建产物 + TEST_MODE 种子）。
const visualServerEnv = [
    'TEST_MODE=true',
    'NUXT_PUBLIC_TEST_MODE=true',
    'MOMEI_INSTALLED=true',
    'DISABLE_CRON_JOB=true',
    `HOST=${visualHost}`,
    `PORT=${visualPort}`,
    `AUTH_SECRET=${visualAuthSecret}`,
    `BETTER_AUTH_SECRET=${visualAuthSecret}`,
    `NUXT_PUBLIC_SITE_URL=${visualBaseURL}`,
    `NUXT_PUBLIC_AUTH_BASE_URL=${visualBaseURL}`,
].join(' ')
const visualServerCommand = `pnpm exec cross-env ${visualServerEnv} node .output/server/index.mjs`

/**
 * 第二实例（安装向导 / 未安装态）：env、命令与 baseURL 统一由
 * `tests/helpers/playwright-servers.ts` 提供，避免 e2e / 基线层 / 门禁层三份副本分叉
 * （曾因门禁层副本缺少 `DATABASE_SYNCHRONIZE` 导致 e2e 复用实例时 `init-db` 500）。
 */

export default defineConfig({
    testDir: './tests/visual/parity',
    testMatch: '**/*.visual-parity.test.ts',
    globalSetup: './tests/e2e/global-setup.ts',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    timeout: 60000,
    expect: {
        toHaveScreenshot: {
            animations: 'disabled',
            caret: 'hide',
            threshold: 0.2,
            scale: 'css',
        },
    },
    reporter: process.env.CI
        ? [['github'], ['list'], ['blob', { outputDir: 'test-results/visual-parity-blob' }]]
        : [['html', { open: 'never', outputFolder: 'playwright-report/visual-parity' }], ['list']],
    /* 参考态快照目录；命名 `<name>.reference.png`，与基线层的 `<name>.png` 并存互不覆盖。 */
    snapshotPathTemplate: 'tests/visual/parity/reference/{arg}{ext}',
    outputDir: 'test-results/visual-parity',
    use: {
        baseURL: visualBaseURL,
        trace: 'off',
        screenshot: 'off',
        video: 'off',
        storageState: 'tests/e2e/.auth/admin.json',
    },
    projects: [
        {
            name: 'chromium-visual-parity',
            /* 安装向导在第二实例（未安装态）运行；默认 project 必须忽略，
             * 否则会被服务端 302 截到首页。 */
            testIgnore: '**/installation.visual-parity.test.ts',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1440, height: 900 },
                deviceScaleFactor: 1,
                locale: 'zh-CN',
                timezoneId: 'Asia/Shanghai',
                colorScheme: 'light',
                reducedMotion: 'reduce',
            },
        },
        {
            name: 'chromium-visual-parity-installation',
            testMatch: '**/installation.visual-parity.test.ts',
            use: {
                ...devices['Desktop Chrome'],
                baseURL: installationBaseURL,
                viewport: { width: 1440, height: 900 },
                deviceScaleFactor: 1,
                locale: 'zh-CN',
                timezoneId: 'Asia/Shanghai',
                colorScheme: 'light',
                reducedMotion: 'reduce',
                /* 与基线层 / e2e 第二实例同口径：该实例没有用户库，
                 * 主实例的 cookie（同 host 跨端口共享）会带来无意义的鉴权查询。 */
                storageState: { cookies: [], origins: [] },
            },
        },
    ],
    webServer: [
        {
            command: visualServerCommand,
            url: visualBaseURL,
            /* 采集参考态时（可能位于独立 git worktree）必须启用自己的 server，
             * 避免误复用 `e2ePort` 上其他工作树的实例。 */
            reuseExistingServer: !process.env.CI && !process.env.PARITY_ISOLATED_SERVER,
            timeout: 600000,
        },
        {
            command: buildInstallationServerCommand(visualAuthSecret),
            /* 用允许的安装态查询作为就绪探针（未安装态下该端点返回 200）。 */
            url: `${installationBaseURL}/api/install/status`,
            reuseExistingServer: !process.env.CI && !process.env.PARITY_ISOLATED_SERVER,
            timeout: 600000,
        },
    ],
})
