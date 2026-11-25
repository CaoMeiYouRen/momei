import { defineConfig, devices } from '@playwright/test'
import { defaultAuthSecret, e2eHost as visualHost, e2ePort as visualPort } from './tests/helpers/playwright-servers'

/**
 * 移动端视觉回归（截图识别层）独立工程配置。
 *
 * 与 `playwright.visual.config.ts`（桌面基线层）、`playwright.visual-parity.config.ts`
 * （桌面一致性门禁）职责隔离、产物隔离：
 * - 本层只覆盖**公开页（reader 面）**，固定 `390×844`（DPR 3，iPhone 13 尺寸）；
 * - 基线快照落在 `tests/visual/mobile/__screenshots__/`，不覆盖桌面基线；
 * - 不纳入 `/admin/**`（排除范围见 `docs/plan/roadmap.md` 第八十五阶段「不做范围」）。
 *
 * 独立入口：
 * - `pnpm test:visual:mobile`        比对移动基线（CI / Review Gate 用）
 * - `pnpm test:visual:mobile:update` 更新移动基线（仅在有意变更并完成归因后使用）
 *
 * 环境可复现纪律与桌面基线层一致：固定 chromium、固定视口 / DPR、zh-CN、Asia/Shanghai、
 * 关闭动画、隐藏光标；动态区域统一以 `[data-visual-mask]` 遮蔽。
 *
 * 快照口径：设备模拟 DPR 3，但 `scale: 'css'` 让比对按 1× CSS 像素进行（快照实际 390×844），
 * 与桌面层同口径，避免 DPR 级亚像素抖动进入门禁信号。
 *
 * 依据：`docs/plan/roadmap.md` 第八十五阶段条目 1 与
 * `docs/design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md` §8.2。
 */

const visualBaseURL = `http://${visualHost}:${visualPort}`

// 与 playwright.visual.config.ts 的 webServer 镜像（同一构建产物 + TEST_MODE 种子）。
const visualServerEnv = [
    'TEST_MODE=true',
    'NUXT_PUBLIC_TEST_MODE=true',
    'MOMEI_INSTALLED=true',
    'DISABLE_CRON_JOB=true',
    `HOST=${visualHost}`,
    `PORT=${visualPort}`,
    `AUTH_SECRET=${defaultAuthSecret}`,
    `BETTER_AUTH_SECRET=${defaultAuthSecret}`,
    `NUXT_PUBLIC_SITE_URL=${visualBaseURL}`,
    `NUXT_PUBLIC_AUTH_BASE_URL=${visualBaseURL}`,
].join(' ')
const visualServerCommand = `pnpm exec cross-env ${visualServerEnv} node .output/server/index.mjs`

export default defineConfig({
    testDir: './tests/visual/mobile',
    testMatch: '**/*.mobile-visual.test.ts',
    /* 公开页也依赖登录态准备（与桌面视觉层同口径），但不进入后台路由。 */
    globalSetup: './tests/e2e/global-setup.ts',
    /* 截图层串行：避免并行渲染导致字体 / 布局抖动。 */
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    timeout: 60000,
    expect: {
        toHaveScreenshot: {
            animations: 'disabled',
            caret: 'hide',
            /* 与桌面基线层同口径：绝对像素上限 200 + 单像素容差 0.2，不得为变绿放宽。 */
            maxDiffPixels: 200,
            threshold: 0.2,
            scale: 'css',
        },
    },
    reporter: process.env.CI
        ? [['github'], ['list'], ['blob', { outputDir: 'test-results/visual-mobile-blob' }]]
        : [['html', { open: 'never', outputFolder: 'playwright-report/visual-mobile' }], ['list']],
    snapshotPathTemplate: 'tests/visual/mobile/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
    outputDir: 'test-results/visual-mobile',
    use: {
        baseURL: visualBaseURL,
        trace: 'off',
        screenshot: 'off',
        video: 'off',
        storageState: 'tests/e2e/.auth/admin.json',
    },
    projects: [
        {
            name: 'chromium-visual-mobile',
            use: {
                ...devices['iPhone 13'],
                /* `devices['iPhone 13']` 自带 `defaultBrowserType: 'webkit'`；本项目门禁统一
                 * 使用 chromium（CI 只安装 chromium），必须显式覆盖，否则 project 会在 WebKit
                 * 中运行并在 CI 因缺少浏览器直接失败。 */
                browserName: 'chromium',
                /* 明确钉住设备参数，避免 Playwright 升级时 devices 描述变化静默改基线。 */
                viewport: { width: 390, height: 844 },
                deviceScaleFactor: 3,
                isMobile: true,
                hasTouch: true,
                locale: 'zh-CN',
                timezoneId: 'Asia/Shanghai',
                colorScheme: 'light',
                reducedMotion: 'reduce',
            },
        },
    ],
    webServer: [
        {
            command: visualServerCommand,
            url: visualBaseURL,
            /* 与基线层共用 `E2E_PORT` 端口（默认 3001）：本地复用已运行实例，CI 为独立 runner。 */
            reuseExistingServer: !process.env.CI,
            timeout: 600000,
        },
    ],
})
