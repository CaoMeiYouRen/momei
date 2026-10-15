import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'
import { ensureBuildOutput, ensurePlaywrightBrowsers, quoteWindowsArg } from './run-e2e.mjs'

/**
 * 视觉一致性门禁「参考态基线」采集脚本。
 *
 * 目标：在组件迁移（PrimeVue → caomei-ui）**之前**，把每个目标路由的 PrimeVue 原貌
 * 固化为参考快照 `<name>.reference.png`，作为后续门禁（`pnpm test:visual:parity`）的
 * 判定依据。参考快照与基线层的 `<name>.png` 并存、互不覆盖。
 *
 * 采集方式：
 * - 默认（`--ref=HEAD`）：在当前工作树直接采集（适用于仍为 PrimeVue 的待迁移路由）；
 * - 指定历史 ref（如 `--ref=44774147^`）：用 `git worktree` 检出该 ref、构建后采集
 *   （适用于已迁移路由，需要其「迁移前提交」的 PrimeVue 原貌）。
 *
 * 环境固定：chromium、1440×900、DSF1、zh-CN、Asia/Shanghai、关闭动画；环境元数据
 * （浏览器版本等）记录到 tests/visual/parity/reference-manifest.json。
 *
 * 用法：
 * - `pnpm test:visual:reference`                                   对 HEAD 全量采集
 * - `pnpm test:visual:reference -- --only=admin-comments-list`      仅采集单个路由（两个主题）
 * - `pnpm test:visual:reference -- --revert=44774147 --only=admin-comments-list`
 * - `pnpm test:visual:reference -- --revert=ff443447 --only=admin-submissions-list`
 * - `pnpm test:visual:reference -- --revert=04d12c17 --only=admin-external-links-list`
 *
 * 已迁移路由的参考态：推荐用 `--revert=<迁移提交>`——在 HEAD 工作树的当前依赖下，把该
 * 迁移提交的源码改动回退到其父提交，使参考态与当前态的差异只来自组件迁移本身（隔离依赖漂移）。
 * `--ref=<历史 ref>` 的直接检出模式仍保留，但部分历史 ref 会因依赖子路径导出缺失而构建崩溃。
 */

const repoRoot = process.cwd()
const referenceDirRel = path.join('tests', 'visual', 'parity', 'reference')
const manifestRel = path.join('tests', 'visual', 'parity', 'reference-manifest.json')
const parityConfigRel = 'playwright.visual-parity.config.ts'
const parityAssets = [
    parityConfigRel,
    path.join('tests', 'visual', 'parity-budget.json'),
    path.join('tests', 'visual', 'parity'),
    path.join('tests', 'visual', 'helpers'),
]

function runIn(cwd, command, args, env = process.env) {
    return new Promise((resolve, reject) => {
        const isWin = process.platform === 'win32'
        const spawnCommand = isWin ? 'cmd.exe' : command
        const spawnArgs = isWin
            ? ['/d', '/s', '/c', [command, ...args].map(quoteWindowsArg).join(' ')]
            : args

        const child = spawn(spawnCommand, spawnArgs, { cwd, env, stdio: 'inherit' })
        child.on('error', reject)
        child.on('exit', (code, signal) => {
            if (code === 0) {
                resolve()
                return
            }
            reject(new Error(`命令失败：${command} ${args.join(' ')}（code=${code ?? 'null'}, signal=${signal ?? 'none'}）`))
        })
    })
}

function runCapture(cwd, command, args, env = process.env) {
    return new Promise((resolve, reject) => {
        const isWin = process.platform === 'win32'
        const spawnCommand = isWin ? 'cmd.exe' : command
        const spawnArgs = isWin
            ? ['/d', '/s', '/c', [command, ...args].map(quoteWindowsArg).join(' ')]
            : args

        const child = spawn(spawnCommand, spawnArgs, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
        let stdout = ''
        let stderr = ''
        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString()
        })
        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString()
        })
        child.on('error', reject)
        child.on('exit', (code, signal) => {
            if (code === 0) {
                resolve({ stdout, stderr })
                return
            }
            reject(new Error(`命令失败：${command} ${args.join(' ')}（code=${code ?? 'null'}, signal=${signal ?? 'none'}）\n${stderr || stdout}`))
        })
    })
}

function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            ref: 'HEAD',
            revert: null,
            only: [],
            label: null,
            keepWorktree: false,
            build: true,
            worktreeBase: null,
        },
        flags: {
            '--keep-worktree': { key: 'keepWorktree' },
            '--no-build': { key: 'build', value: false },
        },
        values: {
            '--ref': { key: 'ref' },
            '--revert': { key: 'revert' },
            '--only': { key: 'only', collect: (prev, value) => [...(prev ?? []), ...value.split(',').map((item) => item.trim()).filter(Boolean)] },
            '--label': { key: 'label' },
            '--worktree-base': { key: 'worktreeBase' },
        },
    })
}

function sanitizeRef(ref) {
    return ref.replace(/[^a-zA-Z0-9._-]+/g, '_')
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

async function getEnvironmentMetadata() {
    const playwrightPkg = readJson(path.join(repoRoot, 'node_modules', 'playwright-core', 'package.json'))
    let browserVersion = 'unknown'
    try {
        const { chromium } = await import('playwright')
        const browser = await chromium.launch()
        browserVersion = browser.version()
        await browser.close()
    } catch (error) {
        browserVersion = `unknown (${error.message})`
    }

    return {
        browser: `chromium ${browserVersion}`,
        playwright: playwrightPkg.version,
        node: process.version,
        platform: `${process.platform} ${os.release()}`,
        viewport: '1440x900',
        deviceScaleFactor: 1,
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai',
        colorScheme: 'light',
        reducedMotion: 'reduce',
        animations: 'disabled',
        caret: 'hide',
        pixelThreshold: 0.2,
    }
}

function getGrepArg(only) {
    if (!only || only.length === 0) {
        return []
    }
    return ['--grep', only.length === 1 ? only[0] : `(${only.join('|')})`]
}

/**
 * HEAD 全量采集时必须排除的 testName：**磁盘上已存在参考态快照者**，以及历史 `--revert`
 * （`source` 以 `worktree` 开头）采集过的条目。
 *
 * 为什么不能只保护 `worktree` 来源（2026-10-14 修正）：**就地（in-place）采集的待迁移路由**
 * 一旦迁移落地，其参考态同样是「迁移前原貌」；旧的过滤口径不保护它，因此下一次
 * `pnpm test:visual:reference`（HEAD 全量）会把它重采为「迁移后渲染」，门禁退化为自比自
 * （2026-10-14 `/admin/waitlist` 分区二审计发现，见视觉一致性门禁 §7.2）。
 *
 * 需要**专门刷新**某条参考态时，显式使用 `--only=<name>`（该入口不参与排除）。
 */
export function getProtectedTestNames(options = {}) {
    const root = options.root ?? repoRoot
    const protectedNames = new Set()

    const manifestPath = path.join(root, manifestRel)
    if (fs.existsSync(manifestPath)) {
        const manifest = readJson(manifestPath)
        for (const [name, value] of Object.entries(manifest.captures ?? {})) {
            if (value && typeof value.source === 'string' && value.source.startsWith('worktree')) {
                protectedNames.add(name)
            }
        }
    }

    const referenceDir = path.join(root, referenceDirRel)
    if (fs.existsSync(referenceDir)) {
        for (const name of fs.readdirSync(referenceDir)) {
            if (name.endsWith('.reference.png')) {
                protectedNames.add(name.replace(/\.reference\.png$/, ''))
            }
        }
    }

    return [...protectedNames].sort()
}

export function buildHeadCaptureGrepArgs(only, options = {}) {
    if (only && only.length > 0) {
        return getGrepArg(only)
    }
    const inverted = getProtectedTestNames(options)
    if (inverted.length === 0) {
        return []
    }
    console.log(`[visual-reference] HEAD 采集排除已有参考态的用例：${inverted.join(', ')}`)
    return ['--grep-invert', inverted.join('|')]
}

function collectReferences(fromDir, sinceMs = 0) {
    if (!fs.existsSync(fromDir)) {
        return []
    }
    return fs.readdirSync(fromDir)
        .filter((name) => name.endsWith('.reference.png'))
        .filter((name) => {
            if (sinceMs <= 0) {
                return true
            }
            return fs.statSync(path.join(fromDir, name)).mtimeMs >= sinceMs - 2000
        })
}

function copyReferences(fromDir, toDir, sinceMs = 0) {
    fs.mkdirSync(toDir, { recursive: true })
    const names = collectReferences(fromDir, sinceMs)
    for (const name of names) {
        fs.copyFileSync(path.join(fromDir, name), path.join(toDir, name))
    }
    return names
}

function updateManifest({ names, ref, commit, source, environment, label }) {
    const manifestPath = path.join(repoRoot, manifestRel)
    const manifest = fs.existsSync(manifestPath)
        ? readJson(manifestPath)
        : { generatedAt: null, environment: null, captures: {} }

    const capturedAt = new Date().toISOString()
    manifest.generatedAt = capturedAt
    manifest.environment = environment
    manifest.captures = manifest.captures ?? {}

    for (const name of names) {
        const testName = name.replace(/\.reference\.png$/, '')
        manifest.captures[testName] = {
            ref,
            commit,
            source,
            label,
            capturedAt,
        }
    }

    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`)
    return names.length
}

function resolveGitCommit(ref) {
    return new Promise((resolve, reject) => {
        const child = spawn('git', ['rev-parse', ref], { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] })
        let stdout = ''
        let stderr = ''
        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString()
        })
        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString()
        })
        child.on('error', reject)
        child.on('exit', (code) => {
            if (code === 0) {
                resolve(stdout.trim())
                return
            }
            reject(new Error(`git rev-parse ${ref} 失败：${stderr.trim()}`))
        })
    })
}

function copyParityAssets(worktreeDir) {
    const parityDirRel = path.join('tests', 'visual', 'parity')
    for (const relative of parityAssets) {
        const source = path.join(repoRoot, relative)
        if (!fs.existsSync(source)) {
            continue
        }
        if (relative === parityDirRel) {
            /* 逐项复制并跳过 reference/：否则会把主仓库已采集的参考态带进工作树，
             * 使「本次采集到的文件」判定失真、进而污染 reference-manifest.json 的来源记录。 */
            const targetDir = path.join(worktreeDir, relative)
            fs.mkdirSync(targetDir, { recursive: true })
            for (const name of fs.readdirSync(source)) {
                if (name === 'reference') {
                    continue
                }
                fs.cpSync(path.join(source, name), path.join(targetDir, name), { recursive: true })
            }
            continue
        }
        fs.cpSync(source, path.join(worktreeDir, relative), { recursive: true })
    }
}

async function captureInPlace({ only, environment }) {
    await ensureBuildOutput()
    await ensurePlaywrightBrowsers()
    const grepArgs = buildHeadCaptureGrepArgs(only)
    const startedAt = Date.now()
    await runIn(repoRoot, 'pnpm', [
        'exec', 'playwright', 'test',
        `--config=${parityConfigRel}`,
        '--update-snapshots',
        /* 保护口径（`getProtectedTestNames`）会排除全部「磁盘上已有参考态」的用例；
         * 当迁移批次把待迁移路由清空后（如 2026-10-16 条目 2 收口，`PENDING_ROUTES` 为空），
         * 全量 HEAD 采集不再有任何候选用例——Playwright 默认会以 `No tests found` 退出码 1，
         * 使这条文档化命令**硬失败**。此处显式声明「无待采目标也算成功」：
         * 需要专门刷新某条参考态时改用 `--only=<name>`（该入口不参与排除）。 */
        '--pass-with-no-tests',
        ...grepArgs,
    ], {
        ...process.env,
        TEST_MODE: 'true',
        PARITY_CAPTURE: '1',
        PARITY_ISOLATED_SERVER: '1',
        PARITY_CAPTURE_REF: 'HEAD',
    })

    const referenceDir = path.join(repoRoot, referenceDirRel)
    const names = collectReferences(referenceDir, startedAt)
    const commit = await resolveGitCommit('HEAD')
    const count = updateManifest({ names, ref: 'HEAD', commit, source: 'in-place', environment, label: 'HEAD' })
    return { names, count }
}

/** 迁移提交中影响渲染的源码路径前缀（仅回退这些；文档 / 锁文件 / 快照 / 测试不参与构建观感）。 */
const revertedSourcePrefixes = ['pages/', 'components/', 'composables/', 'lib/', 'shared/', 'utils/', 'styles/', 'assets/', 'layouts/', 'middleware/', 'plugins/']

/**
 * 在基线工作树内，把某个迁移提交的**源码改动**回退到其父提交状态。
 *
 * 背景：直接 checkout 迁移前的 ref 构建时，会因该 ref 的依赖版本（如 PrimeVue 依赖的
 * `@primeuix/utils` 子路径导出）在当前环境不可用而运行时崩溃；因此改为「当前依赖 +
 * 迁移前页面源码」，从而让参考态与当前态的差异**只来自组件迁移本身**，隔离依赖漂移。
 *
 * 规则：只回退 `revertedSourcePrefixes` 下、状态为 M/D 的文件；提交新增（A）的文件保留，
 * 避免因其他已迁移页面仍引用它们而构建失败。
 */
async function revertCommitSourceChanges(worktreeDir, commit) {
    const { stdout } = await runCapture(repoRoot, 'git', ['show', '--name-status', '--format=', commit])
    const entries = stdout
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [status, ...rest] = line.split(/\s+/)
            return { status, file: rest.join(' ') }
        })

    let reverted = 0
    for (const { status, file } of entries) {
        if (status.startsWith('A') || status.startsWith('R')) {
            continue
        }
        if (!revertedSourcePrefixes.some((prefix) => file.startsWith(prefix))) {
            continue
        }
        await runCapture(worktreeDir, 'git', ['checkout', `${commit}^`, '--', file])
        reverted++
    }
    if (reverted === 0) {
        throw new Error(`未回退任何源码文件：${commit}（请检查提交是否包含 pages/ components/ 等源码改动）`)
    }
    console.log(`[visual-reference] 已回退 ${commit} 的 ${reverted} 个源码文件到其父提交状态`)
    return reverted
}

/**
 * 工作树基于 git 检出，缺少被 gitignore 的工作区包构建产物（`packages/<name>/dist`），
 * 而 `nuxt build` 会被 `server/plugins/mcp-http.ts` 等引用它们。这里从主仓库复制
 * 现有工作区包产物（与本次渲染观感无关），避免在工作树内重复构建包。
 */
function ensureWorkspacePackageDist(worktreeDir) {
    const packagesDir = path.join(repoRoot, 'packages')
    if (!fs.existsSync(packagesDir)) {
        return
    }
    for (const name of fs.readdirSync(packagesDir)) {
        const distSource = path.join(packagesDir, name, 'dist')
        if (!fs.existsSync(distSource)) {
            continue
        }
        fs.cpSync(distSource, path.join(worktreeDir, 'packages', name, 'dist'), { recursive: true })
        console.log(`[visual-reference] 复制工作区包产物：packages/${name}/dist`)
    }
}

async function captureFromWorktree({ ref, revertCommit, only, environment, keepWorktree, build, worktreeBase }) {
    const baseDir = worktreeBase ?? (fs.existsSync('/tmp/opencode') ? '/tmp/opencode' : os.tmpdir())
    const dirSuffix = revertCommit ? `${sanitizeRef(ref)}-revert-${sanitizeRef(revertCommit)}` : sanitizeRef(ref)
    const worktreeDir = path.join(baseDir, `momei-parity-${dirSuffix}`)
    const grepArgs = getGrepArg(only)
    const referenceRef = revertCommit ? `${revertCommit}^` : ref

    if (fs.existsSync(worktreeDir)) {
        throw new Error(`工作树目录已存在，请先清理后再试：${worktreeDir}（可用 git worktree remove --force ${worktreeDir}）`)
    }

    fs.mkdirSync(baseDir, { recursive: true })
    await runIn(repoRoot, 'git', ['worktree', 'add', '--detach', worktreeDir, ref])

    try {
        copyParityAssets(worktreeDir)

        /* 以基线 ref 的锁文件安装依赖。默认 ref=HEAD 时即当前依赖；
         * 若指定历史 ref，该 ref 的依赖版本可能缺失（如旧版 PrimeVue 依赖的
         * `@primeuix/utils/classnames` 子路径在当前 pnpm 布局下不可解析），
         * 此时应改用 `--revert=<迁移提交>` 模式。 */
        await runIn(worktreeDir, 'pnpm', [
            'install', '--frozen-lockfile',
            '--config.confirm-modules-purge=false',
            '--config.verify-deps-before-run=false',
        ], {
            ...process.env,
            npm_config_verify_deps_before_run: 'false',
        })

        if (revertCommit) {
            await revertCommitSourceChanges(worktreeDir, revertCommit)
        }

        ensureWorkspacePackageDist(worktreeDir)

        if (build) {
            await runIn(worktreeDir, 'pnpm', ['--config.verify-deps-before-run=false', 'run', 'build'], {
                ...process.env,
                npm_config_verify_deps_before_run: 'false',
                NODE_OPTIONS: process.env.NODE_OPTIONS ?? '--max-old-space-size=6144',
            })
        }

        await runIn(worktreeDir, 'pnpm', [
            '--config.verify-deps-before-run=false',
            'exec', 'playwright', 'test',
            `--config=${parityConfigRel}`,
            '--update-snapshots',
            ...grepArgs,
        ], {
            ...process.env,
            npm_config_verify_deps_before_run: 'false',
            TEST_MODE: 'true',
            PARITY_CAPTURE: '1',
            PARITY_ISOLATED_SERVER: '1',
            PARITY_CAPTURE_REF: referenceRef,
        })

        const fromDir = path.join(worktreeDir, referenceDirRel)
        const toDir = path.join(repoRoot, referenceDirRel)
        const names = copyReferences(fromDir, toDir)
        const commit = await resolveGitCommit(referenceRef)
        const count = updateManifest({
            names,
            ref: referenceRef,
            commit,
            source: revertCommit ? 'worktree-revert' : 'worktree',
            environment,
            label: revertCommit ? `revert ${revertCommit}` : ref,
        })
        return { names, count, worktreeDir }
    } finally {
        if (keepWorktree) {
            console.log(`[visual-reference] 保留工作树：${worktreeDir}`)
        } else {
            try {
                await runIn(repoRoot, 'git', ['worktree', 'remove', '--force', worktreeDir])
            } catch {
                try {
                    await runIn(repoRoot, 'git', ['worktree', 'prune'])
                    await runIn(repoRoot, 'git', ['worktree', 'remove', '--force', worktreeDir])
                } catch (error) {
                    console.warn(`[visual-reference] 清理工作树失败，请手动处理：${worktreeDir}（${error.message}）`)
                }
            }
        }
    }
}

export async function main(options = {}) {
    const args = options.args ?? parseArgs()
    const environment = await getEnvironmentMetadata()

    console.log(`[visual-reference] ref=${args.ref} revert=${args.revert ?? '-'} only=${args.only.length > 0 ? args.only.join(',') : '(全部)'}`)

    const result = args.ref === 'HEAD' && !args.revert
        ? await captureInPlace({ only: args.only, environment })
        : await captureFromWorktree({
            ref: args.ref,
            revertCommit: args.revert,
            only: args.only,
            environment,
            keepWorktree: args.keepWorktree,
            build: args.build,
            worktreeBase: args.worktreeBase,
        })

    console.log(`[visual-reference] 已采集 ${result.count} 个参考快照：${result.names.join(', ') || '(无)'}`)
    console.log(`[visual-reference] 参考目录：${referenceDirRel}`)
    console.log(`[visual-reference] 环境元数据已写入：${manifestRel}`)
    return result
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
