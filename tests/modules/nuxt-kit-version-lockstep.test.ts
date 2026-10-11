import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { load } from 'js-yaml'
import { describe, expect, it } from 'vitest'

/**
 * `@nuxt/kit` 与 Nuxt 运行时「版本锁步」守卫。
 *
 * 背景：`nuxt` 与 `@nuxt/nitro-server` 都以**精确版本**声明 `@nuxt/kit`
 * （如 `nuxt@4.5.2` → `"@nuxt/kit": "4.5.2"`），而 `pnpm-workspace.yaml` 的 override
 * 会把这份精确 pin 改写成浮动范围。override 本身是必要的——第三方 Nuxt 模块声明的是
 * `^3.x` / `>=3.0.0`，不抬升会解析出 `@nuxt/kit@3.x`；但它一旦允许 `@nuxt/kit` 跨到
 * Nuxt 未要求的次版本，`@nuxt/nitro-server` 就会在 `nuxt prepare`（即 root
 * `postinstall`）阶段导入不存在的符号而崩溃：2026-10 的 dependabot PR #860 / #850
 * 正是 kit 被抬到 4.6.x（该版本已不再导出 `bundlerDiagnostics`）导致的故障。
 *
 * 本守卫锁定的不变量：
 * 1. `@nuxt/kit` 在 lockfile 中只有**单一**版本实例——多实例意味着 override 未收敛，
 *    后续任何一次重解析都可能让某一个实例漂到 Nuxt 未要求的版本线（PR #850 / #860
 *    故障发生前，lockfile 里就同时存在 kit 4.4.6 / 4.5.1 / 4.5.2 三个实例）。
 * 2. 该版本的 `major.minor` 与 `nuxt` 一致。
 * 3. `@nuxt/nitro-server` 的 `major.minor` 与 `nuxt` 一致（三者由 Nuxt 锁步发版）。
 *
 * 覆盖边界：本守卫只校验**已解析版本**层面的一致性。两个已知缺口不在此处兜底：
 * - `pnpm-workspace.yaml` 里的 override 区间被改宽、但未重新生成 lockfile：由 CI 的
 *   `pnpm install --frozen-lockfile` 首步与下一次重解析兜底。
 * - 区间表达式本身的合法性不做 semver 解析（手写区间解析易产生假阴性）。
 */

const ROOT_DIR = process.cwd()

interface LockfileShape {
    packages?: Record<string, unknown>
}

/** 去掉 peer 后缀（`@nuxt/kit@4.5.2(...)` → `4.5.2`），返回该包的已解析版本集合。 */
function resolvedVersions(packages: Record<string, unknown>, packageName: string): string[] {
    const prefix = `${packageName}@`
    const versions = new Set<string>()

    for (const key of Object.keys(packages)) {
        if (!key.startsWith(prefix)) {
            continue
        }

        const [version] = key.slice(prefix.length).split('(')

        if (version !== undefined) {
            versions.add(version)
        }
    }

    return [...versions].sort()
}

/**
 * 断言某包在 lockfile 中恰好只有一个已解析版本，并返回它。
 *
 * 显式判空是为了同时满足 `noUncheckedIndexedAccess` 与「不使用非空断言」的约定：
 * `expect(...).toHaveLength(1)` 不会收窄类型，故这里补一次运行时守卫。
 */
function expectSingleVersion(versions: string[], message: string): string {
    expect(versions, message).toHaveLength(1)

    const [version] = versions

    if (version === undefined) {
        throw new Error(message)
    }

    return version
}

/** 取 `major.minor`，用于比较「版本线」而非精确补丁位。 */
function versionLine(version: string): string {
    const [major = '', minor = ''] = version.split('.')

    return `${major}.${minor}`
}

describe('@nuxt/kit 与 Nuxt 运行时版本锁步', () => {
    it('lockfile 中 @nuxt/kit 收敛为单一版本，且与 nuxt / @nuxt/nitro-server 同主次版本', async () => {
        const lockfile = load(await readFile(path.join(ROOT_DIR, 'pnpm-lock.yaml'), 'utf8')) as LockfileShape
        const packages = lockfile.packages ?? {}

        const nuxtVersion = expectSingleVersion(
            resolvedVersions(packages, 'nuxt'),
            'lockfile 中应恰好解析出一个 nuxt 版本',
        )
        const kitVersion = expectSingleVersion(
            resolvedVersions(packages, '@nuxt/kit'),
            '@nuxt/kit 必须收敛为单一版本；多实例意味着 workspace override 未起作用，重解析时可漂到其他版本线',
        )
        const nitroVersion = expectSingleVersion(
            resolvedVersions(packages, '@nuxt/nitro-server'),
            '@nuxt/nitro-server 由 nuxt 以精确版本引入，应只有一个实例',
        )

        const expectedLine = versionLine(nuxtVersion)

        expect(versionLine(kitVersion), '@nuxt/kit 与 nuxt 必须处于同一主次版本线').toBe(expectedLine)
        expect(versionLine(nitroVersion), '@nuxt/nitro-server 与 nuxt 必须处于同一主次版本线').toBe(expectedLine)
    })
})
