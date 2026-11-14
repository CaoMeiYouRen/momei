import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    captureFromWorktree,
    captureInPlace,
    collectReferences,
    copyParityAssets,
    copyReferences,
    ensureWorkspacePackageDist,
    getEnvironmentMetadata,
    getGrepArg,
    main,
    parseArgs,
    resolveGitCommit,
    revertCommitSourceChanges,
    runCapture,
    runIn,
    sanitizeRef,
    updateManifest,
} from '@/scripts/testing/capture-visual-reference.mjs'

/**
 * `capture-visual-reference.mjs` 的分支补充覆盖（PNG 采集流水线的副作用边界）。
 *
 * 约束：这些用例**不启动浏览器、不执行真实构建**。命令执行通过注入的 `runFn` /
 * `runCaptureFn` / `spawnFn` 替身观测；环境元数据通过 `loadChromiumFn` 注入。
 * 真实子进程只用于 `node -e` 这类毫秒级的纯 Node 语义验证。
 */

function createFakeChild({ exitCode = 0, stdout = '', stderr = '' }: { exitCode?: number, stdout?: string, stderr?: string } = {}) {
    const child = new EventEmitter() as EventEmitter & { stdout: PassThrough, stderr: PassThrough }
    child.stdout = new PassThrough()
    child.stderr = new PassThrough()
    process.nextTick(() => {
        child.stdout.end(stdout)
        child.stderr.end(stderr)
        child.emit('exit', exitCode)
    })
    return child
}

const DEFAULTS = {
    ref: 'HEAD',
    revert: null,
    only: [],
    label: null,
    keepWorktree: false,
    build: true,
    worktreeBase: null,
}

interface SpawnCall {
    command: string
    args: string[]
    options: { cwd?: string, env?: NodeJS.ProcessEnv, stdio?: unknown }
}

interface FakeStream {
    on: (event: 'data', listener: (chunk: Buffer) => void) => unknown
    write: (chunk: string) => void
}

type FakeChild = EventEmitter & { stdout: FakeStream, stderr: FakeStream }

interface RunCall {
    cwd: string
    command: string
    args: string[]
    env?: NodeJS.ProcessEnv
}

let sandbox = ''

function createStream(): FakeStream {
    const emitter = new EventEmitter()
    return {
        on: emitter.on.bind(emitter),
        write(chunk: string) {
            emitter.emit('data', Buffer.from(chunk))
        },
    }
}

function createFakeSpawn(plan: (child: FakeChild) => void) {
    const calls: SpawnCall[] = []
    const spawnFn = (command: string, args: string[], options: SpawnCall['options']): FakeChild => {
        calls.push({ command, args, options })
        const child = Object.assign(new EventEmitter(), { stderr: createStream(), stdout: createStream() }) as FakeChild
        setImmediate(() => plan(child))
        return child
    }
    return { calls, spawnFn }
}

function writeFile(relativePath: string, content = '') {
    const file = path.join(sandbox, relativePath)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content)
    return file
}

function writePng(relativeDir: string, name: string) {
    return writeFile(path.join(relativeDir, name), 'png')
}

function firstOf<T>(items: T[]): T {
    const [first] = items
    if (first === undefined) {
        throw new Error('未记录到任何调用')
    }
    return first
}

function readManifest(root: string) {
    return JSON.parse(fs.readFileSync(path.join(root, 'tests', 'visual', 'parity', 'reference-manifest.json'), 'utf8'))
}

beforeEach(() => {
    sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'momei-capture-visual-'))
})

afterEach(() => {
    fs.rmSync(sandbox, { force: true, recursive: true })
    vi.restoreAllMocks()
})

describe('parseArgs', () => {
    it('无参数时返回 CLI 默认值（HEAD 就地采集 + 构建）', () => {
        expect(parseArgs([])).toEqual(DEFAULTS)
    })

    it('解析全部取值参数与布尔开关', () => {
        expect(parseArgs([
            '--ref=44774147',
            '--revert=ff443447',
            '--label=custom-label',
            '--worktree-base=/tmp/wt',
            '--no-build',
            '--keep-worktree',
        ])).toEqual({
            ...DEFAULTS,
            ref: '44774147',
            revert: 'ff443447',
            label: 'custom-label',
            worktreeBase: '/tmp/wt',
            build: false,
            keepWorktree: true,
        })
    })

    it('--only 按逗号拆分、去空白并丢弃空段，多次传入时累加', () => {
        expect(parseArgs(['--only=home, posts-list ,']).only).toEqual(['home', 'posts-list'])
        expect(parseArgs(['--only=home', '--only=,friend-links']).only).toEqual(['home', 'friend-links'])
    })

    it('--force-all 单独映射为 forceAll 布尔值', () => {
        expect(parseArgs(['--force-all'])).toEqual({ ...DEFAULTS, forceAll: true })
    })

    it('未声明参数直接报错，避免拼写错误被静默忽略', () => {
        expect(() => parseArgs(['--onlyy=home'])).toThrow(/Unsupported argument/u)
    })
})

describe('sanitizeRef', () => {
    it('把路径分隔符、@、空格与 ~ 统一替换为下划线', () => {
        expect(sanitizeRef('feature/foo@bar baz~1')).toBe('feature_foo_bar_baz_1')
        expect(sanitizeRef('origin/HEAD')).toBe('origin_HEAD')
    })

    it('合法字符（字母、数字、点、下划线、连字符）原样保留', () => {
        expect(sanitizeRef('v1.2.3-beta_1')).toBe('v1.2.3-beta_1')
        expect(sanitizeRef('HEAD')).toBe('HEAD')
    })

    it('连续非法字符折叠为单个下划线', () => {
        expect(sanitizeRef('a// @b')).toBe('a_b')
    })
})

describe('getGrepArg', () => {
    it('未传 --only 时返回空参数，交给调用方决定全量口径', () => {
        expect(getGrepArg([])).toEqual([])
        expect(getGrepArg(null)).toEqual([])
    })

    it('单名只命中 <name>-light / <name>-dark，不命中前缀同名的已迁移路由', () => {
        const args = getGrepArg(['posts-list'])
        expect(args[0]).toBe('--grep')
        const grep = new RegExp(args[1] ?? '')

        expect(grep.test('视觉一致性门禁：待迁移路由 posts-list-light')).toBe(true)
        expect(grep.test('视觉一致性门禁：待迁移路由 posts-list-dark')).toBe(true)
        expect(grep.test('视觉一致性门禁：已迁移路由 admin-posts-list-light')).toBe(false)
        expect(grep.test('posts-list')).toBe(false)
    })

    it('多名合成单个非捕获分组，任一名称均命中且互不污染', () => {
        const args = getGrepArg(['home', 'friend-links'])
        expect(args[1]).toBe('(?<![\\w-])(?:home|friend-links)-(light|dark)$')
        const grep = new RegExp(args[1] ?? '')

        expect(grep.test('home-light')).toBe(true)
        expect(grep.test('friend-links-dark')).toBe(true)
        expect(grep.test('admin-home-light')).toBe(false)
        expect(grep.test('admin-friend-links-list-dark')).toBe(false)
    })

    it('名称中的正则元字符会被转义，不会改变匹配语义', () => {
        const grep = new RegExp(getGrepArg(['a.b'])[1] ?? '')
        expect(grep.test('a.b-light')).toBe(true)
        expect(grep.test('axb-light')).toBe(false)
    })
})

describe('runIn', () => {
    it('子进程 code=0 时 resolve', async () => {
        await expect(runIn(process.cwd(), process.execPath, ['-e', 'process.exit(0)'])).resolves.toBeUndefined()
    })

    it('非零 code 时 reject，错误消息包含命令与 code', async () => {
        const error = await runIn(process.cwd(), process.execPath, ['-e', 'process.exit(3)']).catch((reason: Error) => reason)

        expect(error).toBeInstanceOf(Error)
        expect(error.message).toContain('命令失败：')
        expect(error.message).toContain(process.execPath)
        expect(error.message).toContain('code=3, signal=none')
    })

    it('被信号终止时在消息里记录 signal', async () => {
        const { spawnFn } = createFakeSpawn((child) => {
            child.emit('exit', null, 'SIGTERM')
        })

        const error = await runIn('/tmp', 'pnpm', ['exec', 'playwright'], process.env, { spawnFn }).catch((reason: Error) => reason)

        expect(error.message).toContain('code=null, signal=SIGTERM')
    })

    it('spawn 失败（ENOENT 等）原样向上抛出', async () => {
        const { spawnFn } = createFakeSpawn((child) => {
            child.emit('error', new Error('spawn ENOENT'))
        })

        await expect(runIn('/tmp', 'pnpm', ['x'], process.env, { spawnFn })).rejects.toThrow('spawn ENOENT')
    })

    it('以 inherit 模式启动并透传 cwd / env', async () => {
        const { calls, spawnFn } = createFakeSpawn((child) => {
            child.emit('exit', 0, null)
        })
        const env = { ...process.env, TEST_MODE: 'true' }

        await runIn('/work', 'pnpm', ['run', 'build'], env, { spawnFn })

        expect(calls).toHaveLength(1)
        const call = firstOf(calls)
        expect(call.command).toBe('pnpm')
        expect(call.args).toEqual(['run', 'build'])
        expect(call.options.cwd).toBe('/work')
        expect(call.options.env).toBe(env)
        expect(call.options.stdio).toBe('inherit')
    })
})

describe('runCapture', () => {
    it('code=0 时返回聚合后的 stdout / stderr', async () => {
        const result = await runCapture(process.cwd(), process.execPath, [
            '-e',
            'process.stdout.write(process.argv[1]);process.stderr.write(process.argv[2])',
            'out',
            'err',
        ])

        expect(result).toEqual({ stdout: 'out', stderr: 'err' })
    })

    it('分块输出按到达顺序拼接', async () => {
        const { spawnFn } = createFakeSpawn((child) => {
            child.stdout.write('out-')
            child.stdout.write('put')
            child.stderr.write('err')
            child.emit('exit', 0, null)
        })

        await expect(runCapture('/tmp', 'git', ['status'], process.env, { spawnFn }))
            .resolves.toEqual({ stdout: 'out-put', stderr: 'err' })
    })

    it('失败时优先拼接 stderr，并记录 code', async () => {
        const { spawnFn } = createFakeSpawn((child) => {
            child.stdout.write('stdout-line')
            child.stderr.write('stderr-line')
            child.emit('exit', 1, null)
        })

        const error = await runCapture('/tmp', 'git', ['rev-parse', 'nope'], process.env, { spawnFn })
            .catch((reason: Error) => reason)

        expect(error.message).toContain('命令失败：git rev-parse nope')
        expect(error.message).toContain('code=1, signal=none')
        expect(error.message).toContain('stderr-line')
        expect(error.message).not.toContain('stdout-line')
    })

    it('stderr 为空时回退到 stdout，避免失败信息只剩命令名', async () => {
        const { spawnFn } = createFakeSpawn((child) => {
            child.stdout.write('stdout-only')
            child.emit('exit', 2, null)
        })

        const error = await runCapture('/tmp', 'git', ['show'], process.env, { spawnFn }).catch((reason: Error) => reason)

        expect(error.message).toContain('code=2, signal=none')
        expect(error.message).toContain('stdout-only')
    })

    it('spawn 失败时不进入 exit 分支，直接 reject', async () => {
        const { spawnFn } = createFakeSpawn((child) => {
            child.emit('error', new Error('spawn EACCES'))
        })

        await expect(runCapture('/tmp', 'git', ['x'], process.env, { spawnFn })).rejects.toThrow('spawn EACCES')
    })

    it('以管道 stdio 启动（不污染父进程输出）', async () => {
        const { calls, spawnFn } = createFakeSpawn((child) => {
            child.emit('exit', 0, null)
        })

        await runCapture('/work', 'git', ['show', '--name-status'], process.env, { spawnFn })

        expect(firstOf(calls).options.stdio).toEqual(['ignore', 'pipe', 'pipe'])
    })
})

describe('getEnvironmentMetadata', () => {
    function createRootWithPlaywrightPkg(version = '1.99.0') {
        writeFile(path.join('node_modules', 'playwright-core', 'package.json'), JSON.stringify({ version }))
        return sandbox
    }

    it('记录 chromium 版本、playwright 版本与固定渲染环境', async () => {
        const root = createRootWithPlaywrightPkg('1.99.0')
        const close = vi.fn(async () => undefined)
        const loadChromiumFn = vi.fn(async () => ({ launch: async () => ({ version: () => '999.0.0', close }) }))

        const metadata = await getEnvironmentMetadata({ root, loadChromiumFn })

        expect(metadata).toMatchObject({
            browser: 'chromium 999.0.0',
            playwright: '1.99.0',
            viewport: '1440x900',
            deviceScaleFactor: 1,
            locale: 'zh-CN',
            timezoneId: 'Asia/Shanghai',
            colorScheme: 'light',
            animations: 'disabled',
            pixelThreshold: 0.2,
        })
        expect(metadata.node).toBe(process.version)
        expect(metadata.platform.startsWith(process.platform)).toBe(true)
        expect(close).toHaveBeenCalledTimes(1)
        expect(loadChromiumFn).toHaveBeenCalledTimes(1)
    })

    it('浏览器启动失败时降级为 unknown (...)，不中断采集主流程', async () => {
        const root = createRootWithPlaywrightPkg('2.0.0')
        const loadChromiumFn = async () => {
            throw new Error('Missing X server')
        }

        const metadata = await getEnvironmentMetadata({ root, loadChromiumFn })

        expect(metadata.browser).toBe('chromium unknown (Missing X server)')
        expect(metadata.playwright).toBe('2.0.0')
    })
})

describe('参考态文件收集与复制', () => {
    it('collectReferences：目录不存在时返回空数组', () => {
        expect(collectReferences(path.join(sandbox, 'missing'))).toEqual([])
    })

    it('collectReferences：只取 .reference.png，并按 mtime 过滤旧文件', () => {
        const dir = path.join(sandbox, 'reference')
        writePng('reference', 'fresh.reference.png')
        const stale = writePng('reference', 'stale.reference.png')
        writePng('reference', 'baseline.png')
        fs.utimesSync(stale, new Date(Date.now() - 60_000), new Date(Date.now() - 60_000))

        expect(collectReferences(dir)).toEqual(['fresh.reference.png', 'stale.reference.png'])
        expect(collectReferences(dir, Date.now())).toEqual(['fresh.reference.png'])
    })

    it('copyReferences：递归建目录并返回复制清单', () => {
        writePng('from', 'home-light.reference.png')
        writePng('from', 'home-dark.reference.png')
        writeFile(path.join('from', 'README.md'))
        const toDir = path.join(sandbox, 'to', 'deep')

        const names = copyReferences(path.join(sandbox, 'from'), toDir)

        expect(names.sort()).toEqual(['home-dark.reference.png', 'home-light.reference.png'])
        expect(fs.readdirSync(toDir).sort()).toEqual(['home-dark.reference.png', 'home-light.reference.png'])
    })

    it('updateManifest：无清单时创建，写入 environment 与 capture 明细', () => {
        const environment = { browser: 'chromium test' }
        fs.mkdirSync(path.join(sandbox, 'tests', 'visual', 'parity'), { recursive: true })
        const count = updateManifest({
            names: ['home-light.reference.png', 'home-dark.reference.png'],
            ref: 'HEAD',
            commit: 'abc123',
            source: 'in-place',
            environment,
            label: 'HEAD',
            root: sandbox,
        })

        expect(count).toBe(2)
        const manifest = readManifest(sandbox)
        expect(manifest.environment).toEqual(environment)
        expect(manifest.generatedAt).toEqual(expect.any(String))
        expect(Object.keys(manifest.captures).sort()).toEqual(['home-dark', 'home-light'])
        expect(manifest.captures['home-light']).toMatchObject({
            ref: 'HEAD',
            commit: 'abc123',
            source: 'in-place',
            label: 'HEAD',
        })
    })

    it('updateManifest：已有清单时保留其他条目并覆盖同名条目', () => {
        const manifestPath = writeFile(
            path.join('tests', 'visual', 'parity', 'reference-manifest.json'),
            JSON.stringify({
                generatedAt: 'old',
                environment: { browser: 'old' },
                captures: {
                    'legacy-light': { ref: 'v1', source: 'worktree', commit: 'x' },
                    'home-light': { ref: 'v1', source: 'worktree', commit: 'x' },
                },
            }),
        )

        updateManifest({
            names: ['home-light.reference.png'],
            ref: 'HEAD^',
            commit: 'def456',
            source: 'worktree-revert',
            environment: { browser: 'new' },
            label: 'revert def456',
            root: sandbox,
        })

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        expect(manifest.environment).toEqual({ browser: 'new' })
        expect(manifest.captures['legacy-light']).toEqual({ ref: 'v1', source: 'worktree', commit: 'x' })
        expect(manifest.captures['home-light']).toMatchObject({
            ref: 'HEAD^',
            commit: 'def456',
            source: 'worktree-revert',
            label: 'revert def456',
        })
    })
})

describe('copyParityAssets', () => {
    it('复制门禁配置 / 预算 / helpers，并跳过 parity/reference 目录', () => {
        writeFile('playwright.visual-parity.config.ts', 'export default {}')
        writeFile(path.join('tests', 'visual', 'parity-budget.json'), '{}')
        writeFile(path.join('tests', 'visual', 'parity', 'budget.ts'), 'x')
        writePng(path.join('tests', 'visual', 'parity', 'reference'), 'old.reference.png')
        writeFile(path.join('tests', 'visual', 'helpers', 'fixtures.ts'), 'x')

        const worktreeDir = path.join(sandbox, 'worktree')
        copyParityAssets(worktreeDir, { root: sandbox })

        expect(fs.existsSync(path.join(worktreeDir, 'playwright.visual-parity.config.ts'))).toBe(true)
        expect(fs.existsSync(path.join(worktreeDir, 'tests', 'visual', 'parity-budget.json'))).toBe(true)
        expect(fs.existsSync(path.join(worktreeDir, 'tests', 'visual', 'parity', 'budget.ts'))).toBe(true)
        expect(fs.existsSync(path.join(worktreeDir, 'tests', 'visual', 'helpers', 'fixtures.ts'))).toBe(true)
        expect(fs.existsSync(path.join(worktreeDir, 'tests', 'visual', 'parity', 'reference'))).toBe(false)
    })

    it('源资产缺失时跳过而不抛错', () => {
        const worktreeDir = path.join(sandbox, 'empty-worktree')
        expect(() => copyParityAssets(worktreeDir, { root: sandbox })).not.toThrow()
        expect(fs.existsSync(worktreeDir)).toBe(false)
    })
})

describe('ensureWorkspacePackageDist', () => {
    it('只复制存在 dist 的工作区包', () => {
        writeFile(path.join('packages', 'api-client', 'dist', 'index.js'), 'x')
        fs.mkdirSync(path.join(sandbox, 'packages', 'cli'), { recursive: true })
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
        const worktreeDir = path.join(sandbox, 'worktree')

        ensureWorkspacePackageDist(worktreeDir, { root: sandbox })

        expect(fs.existsSync(path.join(worktreeDir, 'packages', 'api-client', 'dist', 'index.js'))).toBe(true)
        expect(fs.existsSync(path.join(worktreeDir, 'packages', 'cli'))).toBe(false)
        expect(log).toHaveBeenCalledWith(expect.stringContaining('packages/api-client/dist'))
    })

    it('主仓库没有 packages 目录时直接返回', () => {
        const worktreeDir = path.join(sandbox, 'worktree')
        expect(() => ensureWorkspacePackageDist(worktreeDir, { root: sandbox })).not.toThrow()
        expect(fs.existsSync(worktreeDir)).toBe(false)
    })
})

describe('resolveGitCommit', () => {
    it('解析 HEAD 为完整 SHA', async () => {
        await expect(resolveGitCommit('HEAD')).resolves.toMatch(/^[0-9a-f]{40}$/u)
    })

    it('未知 ref 时 reject 并带上 git stderr', async () => {
        const error = await resolveGitCommit('__momei_missing_ref__').catch((reason: Error) => reason)

        expect(error.message).toContain('git rev-parse __momei_missing_ref__ 失败')
        expect(error.message).toContain('fatal')
    })

    it('支持注入 root 与 spawnFn：命令 cwd 使用注入根并回传 stdout', async () => {
        const spawnCalls: { args: string[], cwd: string }[] = []
        const spawnFn = vi.fn((_command: string, args: string[], options: { cwd: string }) => {
            spawnCalls.push({ args, cwd: options.cwd })
            return createFakeChild({ exitCode: 0, stdout: `${'a'.repeat(40)}\n` })
        })

        await expect(resolveGitCommit('HEAD~2', { root: '/tmp/injected-root', spawnFn: spawnFn as never }))
            .resolves.toBe('a'.repeat(40))
        expect(spawnCalls).toEqual([{ args: ['rev-parse', 'HEAD~2'], cwd: '/tmp/injected-root' }])
    })
})

describe('revertCommitSourceChanges', () => {
    const SHOW_OUTPUT = [
        'M\tpages/index.vue',
        'A\tpages/brand-new.vue',
        'R100\tpages/old.vue\tpages/new.vue',
        'M\tdocs/guide.md',
        'D\tcomponents/LegacyPanel.vue',
    ].join('\n')

    it('只回退源码前缀下的 M / D 文件，跳过 A / R 与非源码变更', async () => {
        const runCalls: RunCall[] = []
        const runCaptureFn = async (cwd: string, command: string, args: string[]) => {
            runCalls.push({ args, command, cwd })
            return args[0] === 'show' ? { stderr: '', stdout: SHOW_OUTPUT } : { stderr: '', stdout: '' }
        }
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)

        await expect(revertCommitSourceChanges('/worktree', 'ff443447', { root: sandbox, runCaptureFn })).resolves.toBe(2)

        expect(runCalls[0]).toEqual({ args: ['show', '--name-status', '--format=', 'ff443447'], command: 'git', cwd: sandbox })
        expect(runCalls.slice(1)).toEqual([
            { args: ['checkout', 'ff443447^', '--', 'pages/index.vue'], command: 'git', cwd: '/worktree' },
            { args: ['checkout', 'ff443447^', '--', 'components/LegacyPanel.vue'], command: 'git', cwd: '/worktree' },
        ])
        expect(log).toHaveBeenCalledWith(expect.stringContaining('已回退 ff443447 的 2 个源码文件'))
    })

    it('没有任何源码需要回退时直接报错，避免产出「假参考态」', async () => {
        const runCaptureFn = async () => ({ stderr: '', stdout: 'M\tdocs/guide.md\nM\tpnpm-lock.yaml' })

        await expect(revertCommitSourceChanges('/worktree', '04d12c17', { root: sandbox, runCaptureFn }))
            .rejects.toThrow(/未回退任何源码文件：04d12c17/u)
    })
})

describe('captureInPlace', () => {
    function prepareRoot() {
        const root = sandbox
        const protectedSnapshot = writePng(path.join('tests', 'visual', 'parity', 'reference'), 'admin-posts-list-light.reference.png')
        // 已有参考态必须早于本次 startedAt，避免混入「本次新采集」的判定窗口。
        const old = new Date(Date.now() - 60_000)
        fs.utimesSync(protectedSnapshot, old, old)
        return {
            referenceDir: path.join(root, 'tests', 'visual', 'parity', 'reference'),
            root,
        }
    }

    it('按 HEAD 全量口径执行 playwright 采集并写回 manifest', async () => {
        const { referenceDir, root } = prepareRoot()
        const runCalls: RunCall[] = []
        const runFn = async (cwd: string, command: string, args: string[], env?: NodeJS.ProcessEnv) => {
            runCalls.push({ args, command, cwd, env })
            fs.writeFileSync(path.join(referenceDir, 'home-light.reference.png'), 'png')
        }
        const ensureBuildOutputFn = vi.fn(async () => undefined)
        const ensurePlaywrightBrowsersFn = vi.fn(async () => undefined)
        const resolveGitCommitFn = vi.fn(async () => 'b'.repeat(40))

        const result = await captureInPlace({
            only: [],
            environment: { browser: 'chromium test' },
            root,
            runFn,
            ensureBuildOutputFn,
            ensurePlaywrightBrowsersFn,
            resolveGitCommitFn,
        })

        expect(resolveGitCommitFn).toHaveBeenCalledWith('HEAD', { root })

        expect(ensureBuildOutputFn).toHaveBeenCalledTimes(1)
        expect(ensurePlaywrightBrowsersFn).toHaveBeenCalledTimes(1)
        expect(runCalls).toHaveLength(1)
        const call = firstOf(runCalls)
        expect(call.cwd).toBe(root)
        expect(call.command).toBe('pnpm')
        expect(call.args).toEqual(expect.arrayContaining([
            'exec',
            'playwright',
            'test',
            '--config=playwright.visual-parity.config.ts',
            '--update-snapshots',
            '--pass-with-no-tests',
            '--grep-invert',
            'admin-posts-list-light',
        ]))
        expect(call.env).toMatchObject({
            TEST_MODE: 'true',
            PARITY_CAPTURE: '1',
            PARITY_ISOLATED_SERVER: '1',
            PARITY_CAPTURE_REF: 'HEAD',
        })

        expect(result.names).toEqual(['home-light.reference.png'])
        expect(result.count).toBe(1)
        const manifest = readManifest(root)
        expect(manifest.captures['home-light']).toMatchObject({ ref: 'HEAD', source: 'in-place', label: 'HEAD' })
        expect(manifest.captures['home-light'].commit).toMatch(/^[0-9a-f]{40}$/u)
    })

    it('--force-all 在非 CI 环境告警，但不再生成 --grep-invert', async () => {
        const { referenceDir, root } = prepareRoot()
        const runFn = async () => {
            fs.writeFileSync(path.join(referenceDir, 'home-light.reference.png'), 'png')
        }
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const originalCi = process.env.CI
        delete process.env.CI

        try {
            const forceAllRunCalls: RunCall[] = []
            const runFnTracked = async (cwd: string, command: string, args: string[], env?: NodeJS.ProcessEnv) => {
                forceAllRunCalls.push({ args, command, cwd, env })
                await runFn()
            }

            const result = await captureInPlace({
                only: [],
                environment: {},
                forceAll: true,
                root,
                runFn: runFnTracked,
                ensureBuildOutputFn: async () => undefined,
                ensurePlaywrightBrowsersFn: async () => undefined,
                resolveGitCommitFn: async () => 'c'.repeat(40),
            })

            expect(result.count).toBe(1)
            expect(firstOf(forceAllRunCalls).args).not.toContain('--grep-invert')
        } finally {
            if (originalCi !== undefined) {
                process.env.CI = originalCi
            }
        }

        expect(warn).toHaveBeenCalledWith(expect.stringContaining('--force-all 仅应通过 Refresh Visual Reference 工作流'))
    })

    it('CI 环境下 --force-all 不再重复告警', async () => {
        const { referenceDir, root } = prepareRoot()
        const runFn = async () => {
            fs.writeFileSync(path.join(referenceDir, 'home-light.reference.png'), 'png')
        }
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const originalCi = process.env.CI
        process.env.CI = 'true'

        try {
            await captureInPlace({
                only: [],
                environment: {},
                forceAll: true,
                root,
                runFn,
                ensureBuildOutputFn: async () => undefined,
                ensurePlaywrightBrowsersFn: async () => undefined,
                resolveGitCommitFn: async () => 'd'.repeat(40),
            })
        } finally {
            if (originalCi === undefined) {
                delete process.env.CI
            } else {
                process.env.CI = originalCi
            }
        }

        expect(warn).not.toHaveBeenCalled()
    })
})

describe('captureFromWorktree', () => {
    function createWorktreeRunFn({ capture = true }: { capture?: boolean } = {}) {
        const calls: RunCall[] = []
        const runFn = async (cwd: string, command: string, args: string[], env?: NodeJS.ProcessEnv) => {
            calls.push({ args, command, cwd, env })
            if (capture && args.includes('playwright') && args.includes('test')) {
                fs.mkdirSync(path.join(cwd, 'tests', 'visual', 'parity', 'reference'), { recursive: true })
                fs.writeFileSync(path.join(cwd, 'tests', 'visual', 'parity', 'reference', 'home-light.reference.png'), 'png')
            }
        }
        return { calls, runFn }
    }

    function baseOptions(overrides: Record<string, unknown> = {}) {
        return {
            ref: 'HEAD',
            revertCommit: null,
            only: [],
            environment: {},
            keepWorktree: false,
            build: true,
            worktreeBase: path.join(sandbox, 'worktrees'),
            root: sandbox,
            resolveGitCommitFn: async () => 'e'.repeat(40),
            ...overrides,
        }
    }

    it('非 revert 模式：检出工作树 → 装依赖 → 构建 → 采集 → 复制 → 清理', async () => {
        const { calls, runFn } = createWorktreeRunFn()

        const result = await captureFromWorktree(baseOptions({ runFn }))

        const worktreeDir = path.join(sandbox, 'worktrees', 'momei-parity-HEAD')
        expect(result.worktreeDir).toBe(worktreeDir)
        expect(result.names).toEqual(['home-light.reference.png'])
        expect(result.count).toBe(1)
        expect(calls.map((call) => call.args.slice(0, 3))).toEqual([
            ['worktree', 'add', '--detach'],
            ['install', '--frozen-lockfile', '--config.confirm-modules-purge=false'],
            ['--config.verify-deps-before-run=false', 'run', 'build'],
            ['--config.verify-deps-before-run=false', 'exec', 'playwright'],
            ['worktree', 'remove', '--force'],
        ])
        const buildCall = calls.find((call) => call.args.includes('build'))
        expect(buildCall?.env).toMatchObject({
            npm_config_verify_deps_before_run: 'false',
            NODE_OPTIONS: process.env.NODE_OPTIONS ?? '--max-old-space-size=6144',
        })
        const captureCall = calls.find((call) => call.args.includes('playwright'))
        expect(captureCall?.cwd).toBe(worktreeDir)
        expect(captureCall?.env).toMatchObject({
            TEST_MODE: 'true',
            PARITY_CAPTURE: '1',
            PARITY_ISOLATED_SERVER: '1',
            PARITY_CAPTURE_REF: 'HEAD',
        })

        expect(fs.existsSync(path.join(sandbox, 'tests', 'visual', 'parity', 'reference', 'home-light.reference.png'))).toBe(true)
        const manifest = readManifest(sandbox)
        expect(manifest.captures['home-light']).toMatchObject({ ref: 'HEAD', source: 'worktree', label: 'HEAD' })
    })

    it('revert 模式：回退迁移提交源码，manifest 标记 worktree-revert 且保留工作树', async () => {
        const { calls, runFn } = createWorktreeRunFn()
        const runCaptureFn = async (_cwd: string, _command: string, args: string[]) => (
            args[0] === 'show'
                ? { stderr: '', stdout: 'M\tpages/index.vue' }
                : { stderr: '', stdout: '' }
        )
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)

        const result = await captureFromWorktree(baseOptions({ keepWorktree: true, revertCommit: 'HEAD', runCaptureFn, runFn }))

        expect(result.worktreeDir).toBe(path.join(sandbox, 'worktrees', 'momei-parity-HEAD-revert-HEAD'))
        expect(calls.some((call) => call.args.join(' ') === `worktree remove --force ${result.worktreeDir}`)).toBe(false)
        expect(log).toHaveBeenCalledWith(expect.stringContaining('保留工作树'))
        expect(log).toHaveBeenCalledWith(expect.stringContaining('已回退 HEAD 的 1 个源码文件'))

        const captureCall = calls.find((call) => call.args.includes('playwright'))
        expect(captureCall?.env?.PARITY_CAPTURE_REF).toBe('HEAD^')
        expect(readManifest(sandbox).captures['home-light']).toMatchObject({
            ref: 'HEAD^',
            source: 'worktree-revert',
            label: 'revert HEAD',
        })
    })

    it('--no-build 时不执行 pnpm run build', async () => {
        const { calls, runFn } = createWorktreeRunFn()

        await captureFromWorktree(baseOptions({ build: false, runFn }))

        expect(calls.some((call) => call.args.includes('run') && call.args.includes('build'))).toBe(false)
        expect(calls.some((call) => call.args.includes('install'))).toBe(true)
    })

    it('工作树目录已存在时先报错，不执行任何 git / pnpm 命令', async () => {
        const { calls, runFn } = createWorktreeRunFn()
        fs.mkdirSync(path.join(sandbox, 'worktrees', 'momei-parity-HEAD'), { recursive: true })

        await expect(captureFromWorktree(baseOptions({ runFn })))
            .rejects.toThrow(/工作树目录已存在，请先清理后再试/u)
        expect(calls).toEqual([])
    })

    it('清理失败时先 prune 再重试，仍失败则告警但不掩盖采集结果', async () => {
        const calls: RunCall[] = []
        const runFn = async (cwd: string, command: string, args: string[]) => {
            calls.push({ args, command, cwd })
            if (args[0] === 'worktree' && args[1] === 'remove') {
                throw new Error('worktree is dirty')
            }
            if (args.includes('playwright')) {
                fs.mkdirSync(path.join(cwd, 'tests', 'visual', 'parity', 'reference'), { recursive: true })
                fs.writeFileSync(path.join(cwd, 'tests', 'visual', 'parity', 'reference', 'home-light.reference.png'), 'png')
            }
        }
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

        const result = await captureFromWorktree(baseOptions({ runFn }))

        expect(result.count).toBe(1)
        expect(calls.some((call) => call.args.join(' ') === 'worktree prune')).toBe(true)
        expect(calls.filter((call) => call.args[1] === 'remove')).toHaveLength(2)
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('清理工作树失败，请手动处理'))
    })
})

describe('main', () => {
    const environment = { browser: 'chromium test' }

    function createArgs(overrides: Record<string, unknown> = {}) {
        return { ...DEFAULTS, ...overrides }
    }

    it('--force-all 与 --revert / --ref 组合时直接报错', async () => {
        await expect(main({
            args: createArgs({ forceAll: true, revert: 'ff443447' }),
            getEnvironmentMetadataFn: async () => environment,
        })).rejects.toThrow(/--force-all 仅支持当前 HEAD 就地重采/u)

        await expect(main({
            args: createArgs({ forceAll: true, ref: '44774147' }),
            getEnvironmentMetadataFn: async () => environment,
        })).rejects.toThrow(/不能与 --ref \/ --revert 组合使用/u)
    })

    it('默认 HEAD 走就地采集，并把 args 原样传给 captureInPlace', async () => {
        const captureInPlaceFn = vi.fn(async () => ({ count: 1, names: ['home-light.reference.png'] }))
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)

        const result = await main({
            args: createArgs({ only: ['home'] }),
            root: '/tmp/visual-reference-root',
            getEnvironmentMetadataFn: async () => environment,
            captureInPlaceFn,
        })

        expect(result).toEqual({ count: 1, names: ['home-light.reference.png'] })
        expect(captureInPlaceFn).toHaveBeenCalledWith({
            only: ['home'],
            environment,
            forceAll: undefined,
            root: '/tmp/visual-reference-root',
        })
        expect(log).toHaveBeenCalledWith(expect.stringContaining('only=home'))
        expect(log).toHaveBeenCalledWith(expect.stringContaining('已采集 1 个参考快照：home-light.reference.png'))
    })

    it('指定 --ref / --revert 时走工作树采集，并透传 keepWorktree / build / worktreeBase', async () => {
        const captureFromWorktreeFn = vi.fn(async () => ({ count: 0, names: [] }))
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
        const args = createArgs({
            ref: '44774147',
            revert: 'ff443447',
            keepWorktree: true,
            build: false,
            worktreeBase: '/tmp/wt',
        })

        const result = await main({
            args,
            getEnvironmentMetadataFn: async () => environment,
            captureFromWorktreeFn,
        })

        expect(result).toEqual({ count: 0, names: [] })
        expect(captureFromWorktreeFn).toHaveBeenCalledWith({
            ref: '44774147',
            revertCommit: 'ff443447',
            only: [],
            environment,
            keepWorktree: true,
            build: false,
            worktreeBase: '/tmp/wt',
            root: undefined,
        })
        expect(log).toHaveBeenCalledWith(expect.stringContaining('revert=ff443447'))
        expect(log).toHaveBeenCalledWith(expect.stringContaining('已采集 0 个参考快照：(无)'))
    })

    it('未显式传 args 时从 process.argv 解析（覆盖 CLI 默认入口）', async () => {
        const captureInPlaceFn = vi.fn(async () => ({ count: 0, names: [] }))
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        const originalArgv = process.argv
        process.argv = ['node', 'capture-visual-reference.mjs', '--only=home', '--no-build']

        try {
            await main({
                getEnvironmentMetadataFn: async () => environment,
                captureInPlaceFn,
            })
        } finally {
            process.argv = originalArgv
        }

        expect(captureInPlaceFn).toHaveBeenCalledWith({
            only: ['home'],
            environment,
            forceAll: undefined,
            root: undefined,
        })
    })
})
