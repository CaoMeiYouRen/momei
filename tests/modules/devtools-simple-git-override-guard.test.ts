import { readFile } from 'node:fs/promises'
import { load } from 'js-yaml'
import { describe, expect, it } from 'vitest'

/**
 * `simple-git` 大版本 override 与 `@nuxt/devtools` 规避点的一致性守卫。
 *
 * 背景：GHSA-x6jw-m9v5-85vh（critical）的补丁只在 `simple-git` 4.x 线提供，故
 * `pnpm-workspace.yaml` 以裸名 override 把 `simple-git` 抬到 `^4.0.2`。代价是
 * `@nuxt/devtools` 声明的是 `^3.36.0`，其 `module-main` chunk 以
 * `import Git from 'simple-git'`（default 导入）加载 —— 4.x 移除了 default 导出，
 * 该 chunk 一旦被加载即抛 `SyntaxError: does not provide an export named 'default'`。
 *
 * 规避点有两处，触发时机不同，缺任一都会在对应路径直接炸掉：
 * 1. 常规开发 / 构建：`nuxt.config.ts` 的 `devtools: { enabled: false }` 让模块 setup 提前
 *    return，不加载该 chunk。
 * 2. Docker builder 阶段：`pnpm i` 在 `COPY . /app` **之前**执行，该时点目录里没有
 *    `nuxt.config.ts`，规避点 1 失效；必须在 `RUN pnpm i` 之前写入禁用 devtools 的占位配置。
 *    2026-10-12 起 master 的 `Publish Docker Image` 连续多个提交失败即为此因。
 *
 * 覆盖边界：本守卫只做**静态不变量**校验（override 取值 + 两处规避点存在及先后顺序），
 * 不实际启动 Nuxt，也不判断上游 `@nuxt/devtools` 是否已支持 `simple-git` 4。
 */

const ROOT_DIR = process.cwd()

interface WorkspaceShape {
    overrides?: Record<string, string>
}

/** 读取 `pnpm-workspace.yaml` 的 overrides。 */
async function readOverrides(): Promise<Record<string, string>> {
    const content = await readFile(`${ROOT_DIR}/pnpm-workspace.yaml`, 'utf8')
    const parsed = load(content) as WorkspaceShape | undefined

    return parsed?.overrides ?? {}
}

/** 判断 semver 区间是否落在 4.x 线（只做粗判，不引 semver 解析以避免假阴性）。 */
function isSimpleGit4x(range: string): boolean {
    return /(^|[^0-9])4\./u.test(range)
}

describe('simple-git override 与 devtools 规避点一致性', () => {
    it('simple-git override 仍存在（若已移除，请复核 @nuxt/devtools 兼容性后更新本守卫）', async () => {
        const overrides = await readOverrides()

        expect(overrides['simple-git']).toBeTruthy()
    })

    it('override 若在 4.x 线，则 nuxt.config.ts 必须禁用 devtools', async () => {
        const overrides = await readOverrides()
        const range = overrides['simple-git'] ?? ''

        // 前提断言：不在 4.x 线时本守卫的规避要求不再适用，但必须显式复核后更新本守卫，
        // 不允许静默放过（否则 simple-git 下次被抬回 4.x 时无人报警）。
        expect(
            isSimpleGit4x(range),
            `simple-git override 已不在 4.x 线（当前 "${range}"）：请复核 @nuxt/devtools 是否已支持该版本，再决定是移除两处规避点、还是更新本守卫的准入条件。`,
        ).toBe(true)

        const nuxtConfig = await readFile(`${ROOT_DIR}/nuxt.config.ts`, 'utf8')

        expect(nuxtConfig).toMatch(/devtools:\s*\{\s*enabled:\s*false\s*\}/u)
    })

    it('Dockerfile 必须在 RUN pnpm i 之前写入占位配置，且真实配置在其之后才被 COPY 进来', async () => {
        const overrides = await readOverrides()

        expect(
            isSimpleGit4x(overrides['simple-git'] ?? ''),
            `simple-git override 已不在 4.x 线：请复核 @nuxt/devtools 兼容性后更新本守卫的准入条件。`,
        ).toBe(true)

        const dockerfile = await readFile(`${ROOT_DIR}/Dockerfile`, 'utf8')
        const lines = dockerfile.split('\n')

        const installIndex = lines.findIndex((line) => /^\s*RUN\b.*\bpnpm\s+(?:i|install)\b/u.test(line))
        const placeholderIndex = lines.findIndex(
            (line) =>
                /^\s*RUN\b/u.test(line)
                && line.includes('nuxt.config.ts')
                && /devtools:\s*\{\s*enabled:\s*false\s*\}/u.test(line),
        )
        const copyAppIndex = lines.findIndex((line) => /^\s*COPY\s+\.\s+\/app\s*$/u.test(line))

        expect(installIndex).toBeGreaterThan(-1)
        expect(placeholderIndex).toBeGreaterThan(-1)
        expect(copyAppIndex).toBeGreaterThan(-1)
        // 顺序是本守卫的核心：占位配置必须早于依赖安装，否则 `nuxt prepare` 仍会在无配置目录中加载 devtools。
        expect(placeholderIndex).toBeLessThan(installIndex)
        // 同时要求真实配置在安装之后才拷入：若 `COPY . /app` 被前移到占位步骤之前，
        // 占位件会反向覆盖真实配置，`pnpm run build` 将以 stub 配置静默产出残缺 `.output`。
        expect(copyAppIndex).toBeGreaterThan(installIndex)
    })
})
