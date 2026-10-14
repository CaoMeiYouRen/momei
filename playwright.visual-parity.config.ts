import { defineConfig, devices } from '@playwright/test'

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

const visualHost = '127.0.0.1'
const visualPort = 3001
const visualBaseURL = `http://${visualHost}:${visualPort}`
const visualAuthSecret = 'lhci-test-secret-0123456789abcdef'

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
    ],
    webServer: {
        command: visualServerCommand,
        url: visualBaseURL,
        /* 采集参考态时（可能位于独立 git worktree）必须启用自己的 server，
         * 避免误复用端口 3001 上其他工作树的实例。 */
        reuseExistingServer: !process.env.CI && !process.env.PARITY_ISOLATED_SERVER,
        timeout: 600000,
    },
})
