import { getCliArgs, isDirectExecution } from '../shared/cli.mjs'
import { ensureBuildOutput, ensurePlaywrightBrowsers, run } from './run-e2e.mjs'

/**
 * 视觉回归（截图识别层）运行入口。
 *
 * 复用 e2e 的「构建产物新鲜度检查 + Playwright 浏览器安装」前置，再以**独立 config**
 * (`playwright.visual.config.ts`) 运行截图比对，避免污染 `pnpm test:e2e` 的 testMatch 与产物。
 *
 * 用法：
 * - `pnpm test:visual`                 比对基线
 * - `pnpm test:visual:update`          更新基线快照（仅在有意变更并完成归因后使用）
 * - `pnpm test:visual -- --grep=...`   定向运行
 *
 * 依据见 docs/design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md §8.2。
 */

export async function main(options = {}) {
    const getCliArgsFn = options.getCliArgsFn ?? getCliArgs
    const ensureBuildOutputFn = options.ensureBuildOutputFn ?? ensureBuildOutput
    const ensurePlaywrightBrowsersFn = options.ensurePlaywrightBrowsersFn ?? ensurePlaywrightBrowsers
    const runFn = options.runFn ?? run
    const runtimeEnv = options.runtimeEnv ?? process.env

    const playwrightArgs = getCliArgsFn()

    await ensureBuildOutputFn()
    await ensurePlaywrightBrowsersFn()
    await runFn(
        'pnpm',
        ['exec', 'playwright', 'test', '--config=playwright.visual.config.ts', ...playwrightArgs],
        {
            ...runtimeEnv,
            TEST_MODE: 'true',
        },
    )
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
