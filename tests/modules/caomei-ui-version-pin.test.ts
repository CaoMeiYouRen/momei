import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * `caomei-ui` 版本锁定的**人工升级守护**。
 *
 * 背景：精确锁定只能固定声明值，拦不住 Dependabot 在精确值上继续抬版——`0.3.0 → 0.5.0 → 0.6.0`
 * 就是只改 `package.json` / 锁文件、跳过「读 `BREAKING CHANGES` + 重跑视觉与包体回归」发生的
 * （迁移方案 §3.8）。`.github/dependabot.yml` 已加 `ignore`，但 semver 的预发布规则使
 * `>=1.0.0-rc.2` 覆盖不到更高 minor 的预发布（如 `1.1.0-rc.1`），故本守卫把「必须人工批准」
 * 落到 CI：
 *
 * 1. 声明值必须是**精确版本**（不得出现 `^` / `~` / `>=` / `*` / `file:` 等形态）；
 * 2. 锁文件解析出的版本必须与声明值一致；
 * 3. 声明值必须在本文件的人工批准清单 `APPROVED_VERSIONS` 内。
 *
 * 升级流程（唯一入口）：读目标版本 `CHANGELOG` / `BREAKING CHANGES` → 同步 `styles/main.scss`
 * 的 token 桥接与 `tests/visual/caomei-token-bridge.visual.test.ts` 的契约常量 → 重采视觉基线、
 * 重校准 parity 允许清单、复测 `keyCss` → 把新版本加入 `APPROVED_VERSIONS` 并提交一次独立提交。
 *
 * 依据见 docs/design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md §3.8 / §5.6 / §3.10。
 */

const ROOT_DIR = process.cwd()

/**
 * 人工批准过的版本清单（按时间追加，不删除历史项）。
 *
 * 新增条目必须伴随该版本的升级证据（回归记录窗口 + 迁移方案 §3.x 段落），不得只改本数组。
 */
const APPROVED_VERSIONS = ['0.7.0', '1.0.0-rc.1'] as const

const EXACT_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u

interface PackageJsonShape {
    dependencies?: Record<string, string>
}

/**
 * 从 lockfile 的 `packages:` 段提取某个包的已解析版本。
 *
 * 只读 `packages:` 而非 `snapshots:`：后者键带 peer 后缀（`caomei-ui@1.0.0-rc.1(@nuxt/kit…)`），
 * 一个版本会因 peer 组合不同出现多次，用来判断「是否多版本」会误报。
 */
function resolvedVersions(lockfile: string, packageName: string): string[] {
    const packagesSection = lockfile.split(/^packages:\s*$/mu)[1]?.split(/^snapshots:\s*$/mu)[0] ?? ''
    const pattern = new RegExp(`^ {2}${packageName.replaceAll('.', '\\.')}@([^\\s:]+):`, 'gmu')
    return [...new Set(Array.from(packagesSection.matchAll(pattern)).map((match) => match[1] ?? ''))]
}

describe('caomei-ui 版本锁定：人工升级守护', () => {
    it('package.json 使用精确版本并落在人工批准清单内', async () => {
        const raw = await readFile(path.join(ROOT_DIR, 'package.json'), 'utf8')
        const declared = (JSON.parse(raw) as PackageJsonShape).dependencies?.['caomei-ui'] ?? ''

        expect(declared, 'caomei-ui 必须声明精确版本（不得使用范围 / tag / file: 形态）').toMatch(EXACT_VERSION_PATTERN)
        expect(APPROVED_VERSIONS as readonly string[], `caomei-ui@${declared} 未在人工批准清单内：请按迁移方案 §5.6 走升级流程后再追加`).toContain(declared)
    })

    it('lockfile 解析出的 caomei-ui 只有一个版本，且与 package.json 一致', async () => {
        const raw = await readFile(path.join(ROOT_DIR, 'pnpm-lock.yaml'), 'utf8')
        const pkgRaw = await readFile(path.join(ROOT_DIR, 'package.json'), 'utf8')
        const declared = (JSON.parse(pkgRaw) as PackageJsonShape).dependencies?.['caomei-ui'] ?? ''

        const versions = resolvedVersions(raw, 'caomei-ui')

        expect(versions, 'lockfile 中 caomei-ui 的已解析版本应唯一').toHaveLength(1)
        expect(versions[0], 'lockfile 已解析版本应与 package.json 的精确声明一致').toBe(declared)
    })
})
