import { defineConfig, devices } from '@playwright/test'

/**
 * 视觉回归（截图识别层）独立工程配置。
 *
 * 迁移方案 §8.2 第三层：与既有 `playwright.config.ts`（E2E 功能层）完全隔离的独立 config / project，
 * 不并入 `pnpm test:e2e` / `test:e2e:critical` / `test:e2e:review-gate` 的 `testMatch` 与断言语义。
 *
 * 独立入口：
 * - `pnpm test:visual`        运行比对（CI / Review Gate 用）
 * - `pnpm test:visual:update` 更新基线快照（仅在有意变更并完成归因后使用）
 *
 * 环境可复现纪律（§8.2）：固定浏览器渠道（chromium）、固定 viewport / deviceScaleFactor、
 * 固定 locale 与时区、关闭动画（`animations: 'disabled'`）、隐藏光标（`caret: 'hide'`）；
 * 动态区域统一以 `[data-visual-mask]` 显式遮蔽（见 tests/visual/helpers/visual.ts）。
 *
 * 依据见 docs/design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md §8.2。
 */

const visualHost = '127.0.0.1'
const visualPort = 3001
const visualBaseURL = `http://${visualHost}:${visualPort}`
const visualAuthSecret = 'lhci-test-secret-0123456789abcdef'

// 有意镜像 playwright.config.ts 的 e2e webServer（同一构建产物 + TEST_MODE 种子）。
// 上游若调整该 server env，须同步此处（见回归记录 M2 节「webServer 镜像」）。
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
    testDir: './tests/visual',
    /* 复用既有 e2e 认证态准备逻辑（生成 tests/e2e/.auth/admin.json）；不改变其语义 */
    globalSetup: './tests/e2e/global-setup.ts',
    /* 截图层串行：避免并行渲染导致字体 / 布局抖动 */
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    /* 截图层不做重试：不稳定即失败并归因，不用重试掩盖抖动 */
    retries: 0,
    workers: 1,
    timeout: 60000,
    expect: {
        toHaveScreenshot: {
            /* 关闭动画、隐藏光标，保证渲染确定 */
            animations: 'disabled',
            caret: 'hide',
            /* 阈值策略：绝对像素上限 200 + 单像素容差 0.2。
             * 绝对上限保证细粒度 token 改动（圆角 / 间距 / 颜色）可被检出，而非被视口比例吞掉；
             * 不得为让测试变绿而放宽。实测 `--p-surface-card` 改动即产生全屏级 diff（远超 200px）。 */
            maxDiffPixels: 200,
            threshold: 0.2,
            scale: 'css',
        },
    },
    /* CI：GitHub 注解 + list + blob；本地：独立 HTML 报告目录，避免覆盖 e2e 报告 */
    reporter: process.env.CI
        ? [['github'], ['list'], ['blob', { outputDir: 'test-results/visual-blob' }]]
        : [['html', { open: 'never', outputFolder: 'playwright-report/visual' }], ['list']],
    /* 基线快照随仓库提交；失败产物 -actual / -diff 落于 outputDir（test-results/visual/），不污染 __screenshots__ */
    snapshotPathTemplate: 'tests/visual/__screenshots__/{testFilePath}/{arg}{ext}',
    outputDir: 'test-results/visual',
    use: {
        baseURL: visualBaseURL,
        trace: 'off',
        screenshot: 'off',
        video: 'off',
        storageState: 'tests/e2e/.auth/admin.json',
    },
    projects: [
        {
            name: 'chromium-visual',
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
        /* 服务器由本 config 的 webServer 启动（workflow 只负责构建 / 下载产物）。
         * 与 e2e 共用端口 3001：CI 为独立 runner 无冲突；本地避免与 dev / e2e 并发运行。
         * 本地复用已运行服务；CI 不复用（与 playwright.config.ts 一致）。 */
        reuseExistingServer: !process.env.CI,
        timeout: 600000,
    },
})
