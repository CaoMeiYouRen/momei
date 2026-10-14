import { getCliArgs, isDirectExecution } from '../shared/cli.mjs'
import { ensureBuildOutput, ensurePlaywrightBrowsers, run } from './run-e2e.mjs'

/**
 * 视觉一致性门禁（visual parity gate）运行入口。
 *
 * 复用 e2e 的「构建产物新鲜度检查 + Playwright 浏览器安装」前置，再以**独立 config**
 * (`playwright.visual-parity.config.ts`) 运行「当前渲染 ↔ 迁移前参考态」比对。
 *
 * 用法：
 * - `pnpm test:visual:parity`                比对参考态
 * - `pnpm test:visual:parity -- --grep=...`  定向运行（脚本会剔除 pnpm 透传的 `--` 分隔符）
 *
 * 报告：每个用例无论通过与否都会打印「testName / tier / 预算 / 实测差异 / 允许清单 /
 * 未归因差异 / 超差区域 / 结果」行，并落盘 test-results/visual-parity/report/<name>.json。
 *
 * 依据见 docs/standards/testing.md §7.2 与
 * docs/design/governance/2026-10-13-visual-parity-gate.md。
 */

export async function main(options = {}) {
    const getCliArgsFn = options.getCliArgsFn ?? getCliArgs
    const ensureBuildOutputFn = options.ensureBuildOutputFn ?? ensureBuildOutput
    const ensurePlaywrightBrowsersFn = options.ensurePlaywrightBrowsersFn ?? ensurePlaywrightBrowsers
    const runFn = options.runFn ?? run
    const runtimeEnv = options.runtimeEnv ?? process.env

    /* `pnpm test:visual:parity -- --grep=X` 会把 `--` 分隔符一并透传给本脚本；
     * Playwright 收到 `--` 后会停止解析后续选项（`--grep` 被当作位置过滤参数），
     * 表现为「忽略 grep、22 条全跑」。此处剔除 `--` 后再转发，使定向运行按预期生效。 */
    const playwrightArgs = getCliArgsFn().filter((arg) => arg !== '--')

    await ensureBuildOutputFn()
    await ensurePlaywrightBrowsersFn()
    await runFn(
        'pnpm',
        ['exec', 'playwright', 'test', '--config=playwright.visual-parity.config.ts', ...playwrightArgs],
        {
            ...runtimeEnv,
            TEST_MODE: 'true',
            /* 门禁比对必须使用与本 config 匹配的 server 实例，避免误复用端口 3001 上
             * 其他 / 已退出工作树残留的实例（会表现为 net::ERR_EMPTY_RESPONSE /
             * ERR_CONNECTION_REFUSED 的假红）。CI 下本项本就为 false。 */
            PARITY_ISOLATED_SERVER: '1',
        },
    )
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
