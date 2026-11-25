import { getCliArgs, isDirectExecution } from '../shared/cli.mjs'
import { ensureBuildOutput, ensurePlaywrightBrowsers, run } from './run-e2e.mjs'

/**
 * 移动端视觉回归（390×844 / DPR 3）运行入口。
 *
 * 与桌面基线层同构：先做「构建产物新鲜度检查 + Playwright 浏览器安装」，
 * 再以**独立 config** (`playwright.visual-mobile.config.ts`) 运行移动快照比对，
 * 避免污染桌面基线与 e2e 的 testMatch / 产物。
 *
 * 用法：
 * - `pnpm test:visual:mobile`                 比对移动基线
 * - `pnpm test:visual:mobile:update`          更新移动基线（仅在有意变更并完成归因后使用）
 * - `pnpm test:visual:mobile -- --grep=...`   定向运行
 *
 * 依据：docs/plan/roadmap.md 第八十五阶段条目 1。
 */

export async function main(options = {}) {
    const getCliArgsFn = options.getCliArgsFn ?? getCliArgs
    const ensureBuildOutputFn = options.ensureBuildOutputFn ?? ensureBuildOutput
    const ensurePlaywrightBrowsersFn = options.ensurePlaywrightBrowsersFn ?? ensurePlaywrightBrowsers
    const runFn = options.runFn ?? run
    const runtimeEnv = options.runtimeEnv ?? process.env

    const playwrightArgs = getCliArgsFn().filter((arg) => arg !== '--')

    await ensureBuildOutputFn()
    await ensurePlaywrightBrowsersFn()
    await runFn(
        'pnpm',
        ['exec', 'playwright', 'test', '--config=playwright.visual-mobile.config.ts', ...playwrightArgs],
        {
            ...runtimeEnv,
            TEST_MODE: 'true',
        },
    )
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
