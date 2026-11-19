import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    DEFAULT_GEOMETRY_PROBES,
    main,
    measureProbe,
    normalizeProbes,
    parseArgs,
    runRealProbes,
    signIn,
    waitForSeededAdmin,
    waitForServer,
    writeReport,
} from '@/scripts/testing/probe-build-geometry.mjs'

/**
 * 构建产物几何探针的运行时分支：
 * - 服务就绪 / 种子就绪 / 登录三段等待的重试与超时；
 * - 页面内测量闭包（缺元素、合成档位、尺寸回退）；
 * - `runRealProbes` 的编排（缺产物跳过、复用外部服务不 spawn、逐项测量与失败兜底、清理服务进程）；
 * - `main` 的实测报告输出与失败退出码。
 *
 * 浏览器与服务均以注入依赖替代，不启动真实进程。
 */

const silentLog = { error: vi.fn(), info: vi.fn(), warn: vi.fn() }
const probes = normalizeProbes(DEFAULT_GEOMETRY_PROBES)

/** 可控时钟：`sleep` 推进 `now`，让超时循环在有限次重试后退出。 */
function createClock(step = 500) {
    let elapsed = 0

    return {
        now: () => elapsed,
        sleep: (ms: number) => {
            elapsed += ms || step
            return Promise.resolve()
        },
    }
}

describe('probe-build-geometry 等待与登录', () => {
    it('服务返回 <500 即视为就绪', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({ status: 200 })

        await expect(waitForServer('http://x', 1000, { fetchImpl, now: () => 0 })).resolves.toBeUndefined()
        expect(fetchImpl).toHaveBeenCalledWith('http://x/api/install/status')
    })

    it('5xx 与网络错误会重试，超时后抛出带最后错误的消息', async () => {
        let calls = 0
        const fetchImpl = vi.fn().mockImplementation(async () => {
            calls += 1
            if (calls === 1) {
                throw new Error('ECONNREFUSED')
            }

            return { status: 503 }
        })
        const clock = createClock()

        await expect(waitForServer('http://x', 1200, {
            fetchImpl,
            now: clock.now,
            sleep: clock.sleep,
        })).rejects.toThrow(/HTTP 503/u)
        expect(fetchImpl.mock.calls.length).toBeGreaterThan(1)
    })

    it('无任何响应时给出「无响应」提示', async () => {
        const clock = createClock()

        await expect(waitForServer('http://x', 600, {
            fetchImpl: vi.fn().mockRejectedValue(new Error('')),
            now: clock.now,
            sleep: clock.sleep,
        })).rejects.toThrow(/无响应/u)
    })

    it('种子就绪后返回，未就绪则超时', async () => {
        const ready = vi.fn().mockResolvedValue({ json: async () => ({ data: { installed: true } }) })

        await expect(waitForSeededAdmin('http://x', 1000, { fetchImpl: ready, now: () => 0 })).resolves.toBeUndefined()

        const pending = vi.fn().mockResolvedValue({ json: async () => ({ data: { installed: false } }) })
        const clock = createClock()

        await expect(waitForSeededAdmin('http://x', 600, {
            fetchImpl: pending,
            now: clock.now,
            sleep: clock.sleep,
        })).rejects.toThrow(/种子未在/u)
    })

    it('种子接口抛错时继续等待', async () => {
        let calls = 0
        const fetchImpl = vi.fn().mockImplementation(async () => {
            calls += 1
            if (calls === 1) {
                throw new Error('not ready')
            }

            return { json: async () => ({ data: { installed: true } }) }
        })

        const clock = createClock()

        await expect(waitForSeededAdmin('http://x', 1000, {
            fetchImpl,
            now: clock.now,
            sleep: clock.sleep,
        })).resolves.toBeUndefined()
    })

    it('登录成功即返回，失败重试后超时', async () => {
        const okContext = { request: { post: vi.fn().mockResolvedValue({ ok: () => true, status: () => 200 }) } }

        await expect(signIn(okContext, 'http://x', 1000, {
            now: () => 0,
            waitForSeededAdmin: vi.fn(),
        })).resolves.toBeUndefined()


        const failingContext = { request: { post: vi.fn().mockResolvedValue({ ok: () => false, status: () => 401 }) } }
        const clock = createClock()

        await expect(signIn(failingContext, 'http://x', 600, {
            now: clock.now,
            sleep: clock.sleep,
            waitForSeededAdmin: vi.fn(),
        })).rejects.toThrow(/HTTP 401/u)
    })
})

describe('probe-build-geometry 页面测量', () => {
    class FakeElement {
        children: FakeElement[] = []
        style = {
            setProperty: vi.fn(),
            left: '',
            position: '',
            top: '',
            visibility: '',
        }

        readonly tagName = 'DIV'

        cloneNode() {
            return new FakeElement()
        }

        getAttribute() {
            return null
        }

        getBoundingClientRect() {
            return { height: 30, width: 20 }
        }

        setAttribute() {
            // no-op
        }
    }

    let queryResult: unknown
    let computed: { width: string, height: string }

    beforeEach(() => {
        queryResult = new FakeElement()
        computed = { height: '64px', width: '64px' }
        const globals = globalThis as unknown as Record<string, unknown>
        globals.HTMLElement = FakeElement
        globals.document = {
            body: { appendChild: vi.fn() },
            querySelector: () => queryResult,
        }
        globals.getComputedStyle = () => computed
    })

    afterEach(() => {
        const globals = globalThis as unknown as Record<string, unknown>
        delete globals.HTMLElement
        delete globals.document
        delete globals.getComputedStyle
    })

    const evaluatePage = { evaluate: async (fn: (value: unknown) => unknown, value: unknown) => fn(value) }

    it('未找到元素返回 found=false', async () => {
        queryResult = null

        await expect(measureProbe(evaluatePage, probes[0])).resolves.toEqual({ found: false })
    })

    it('命中元素时读取计算宽度与高度', async () => {
        await expect(measureProbe(evaluatePage, probes[0])).resolves.toMatchObject({ found: true, height: 64, width: 64 })
    })

    it('合成档位克隆元素并写入 CSS 变量', async () => {
        computed = { height: '48px', width: '48px' }

        const result = await measureProbe(evaluatePage, probes[2])

        expect(result).toMatchObject({ found: true, height: 48, width: 48 })
        expect((globalThis as unknown as { document: { body: { appendChild: ReturnType<typeof vi.fn> } } }).document.body.appendChild)
            .toHaveBeenCalledTimes(1)
    })

    it('克隆结果不是元素时返回 found=false', async () => {
        queryResult = Object.assign(new FakeElement(), { cloneNode: () => ({}) })

        await expect(measureProbe(evaluatePage, probes[2])).resolves.toEqual({ found: false })
    })

    it('计算样式解析失败时回退到包围盒', async () => {
        computed = { height: '', width: '' }
        const element = new FakeElement()
        Object.assign(element, {
            getBoundingClientRect: () => ({ height: 30, width: 20 }),
        })
        queryResult = element

        await expect(measureProbe(evaluatePage, probes[0])).resolves.toEqual({ found: true, height: 30, width: 20 })
    })
})

describe('probe-build-geometry 实测编排', () => {
    function createDeps(overrides: Record<string, unknown> = {}) {
        const page = {
            goto: vi.fn().mockResolvedValue(undefined),
            waitForSelector: vi.fn().mockResolvedValue(undefined),
        }
        const context = { newPage: vi.fn().mockResolvedValue(page) }
        const browser = {
            close: vi.fn().mockResolvedValue(undefined),
            newContext: vi.fn().mockResolvedValue(context),
        }

        return {
            browser,
            chromiumImpl: { launch: vi.fn().mockResolvedValue(browser) },
            context,
            measureProbeFn: vi.fn().mockImplementation(async (_page: unknown, probe: { expected: { height: number, width: number } }) => ({
                found: true,
                ...probe.expected,
            })),
            page,
            signInFn: vi.fn().mockResolvedValue(undefined),
            waitForServerFn: vi.fn().mockResolvedValue(undefined),
            ...overrides,
        }
    }

    it('构建产物缺失时跳过且不启动服务', async () => {
        const deps = createDeps({ exists: () => false })
        const outcome = await runRealProbes({
            buildEntry: '.output/server/index.mjs',
            deps,
            port: 3101,
            probes,
            rootDir: '/repo',
            timeoutMs: 1000,
        })

        expect(outcome.skipped).toBe(true)
        expect(outcome.skipReason).toContain('构建产物不存在')
        expect(deps.chromiumImpl.launch).not.toHaveBeenCalled()
    })

    it('复用 --base-url 时不 spawn 服务，逐项测量并关闭浏览器', async () => {
        const deps = createDeps()
        const outcome = await runRealProbes({
            baseEntry: undefined,
            baseUrl: 'http://127.0.0.1:3101',
            buildEntry: '.output/server/index.mjs',
            deps,
            port: 3101,
            probes,
            rootDir: '/repo',
            timeoutMs: 1000,
        })

        expect(outcome.skipped).toBe(false)
        expect(outcome.results).toHaveLength(3)
        expect(outcome.baseURL).toBe('http://127.0.0.1:3101')
        expect(deps.signInFn).toHaveBeenCalledTimes(1)
        expect(deps.browser.close).toHaveBeenCalledTimes(1)
    })

    it('元素等待超时判为未找到而不中断其余探针', async () => {
        const deps = createDeps()
        deps.page.waitForSelector
            .mockRejectedValueOnce(new Error('timeout'))
            .mockResolvedValue(undefined)

        const outcome = await runRealProbes({
            baseUrl: 'http://127.0.0.1:3101',
            buildEntry: 'x',
            deps,
            port: 3101,
            probes,
            rootDir: '/repo',
            timeoutMs: 1000,
        })

        expect(outcome.results[0]).toMatchObject({ found: false, ok: false })
        expect(outcome.results[1]).toMatchObject({ found: true, ok: true })
    })

    it('自行启动服务时在结束时终止进程', async () => {
        const kill = vi.fn()
        const serverProcess = {
            kill,
            on: vi.fn(),
            stderr: { on: vi.fn() },
            stdout: { on: vi.fn() },
        }
        const deps = createDeps({
            exists: () => true,
            spawnImpl: vi.fn().mockReturnValue(serverProcess),
        })

        await runRealProbes({
            buildEntry: '.output/server/index.mjs',
            deps,
            port: 3101,
            probes: [probes[0]],
            rootDir: '/repo',
            timeoutMs: 1000,
        })

        expect(deps.spawnImpl).toHaveBeenCalledTimes(1)
        expect(kill).toHaveBeenCalledWith('SIGTERM')
    })

    it('服务提前退出时打印日志尾部', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const listeners: ((code: number) => void)[] = []
        const stdoutListeners: ((chunk: string) => void)[] = []
        const serverProcess = {
            kill: vi.fn(),
            on: (_event: string, handler: (code: number) => void) => listeners.push(handler),
            stderr: { on: vi.fn() },
            stdout: { on: (_event: string, handler: (chunk: string) => void) => stdoutListeners.push(handler) },
        }
        const deps = createDeps({
            exists: () => true,
            spawnImpl: vi.fn().mockReturnValue(serverProcess),
        })

        await runRealProbes({
            buildEntry: 'x',
            deps,
            port: 3101,
            probes: [probes[0]],
            rootDir: '/repo',
            timeoutMs: 1000,
        })

        stdoutListeners[0]?.('boom-log')
        listeners[0]?.(1)

        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('服务提前退出'))
        warnSpy.mockRestore()
    })
})

describe('probe-build-geometry 实测入口', () => {
    let directory = ''

    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'momei-geometry-runtime-'))
        process.exitCode = undefined
        silentLog.info.mockClear()
        silentLog.warn.mockClear()
        silentLog.error.mockClear()
    })

    afterEach(async () => {
        await rm(directory, { recursive: true, force: true })
        process.exitCode = undefined
    })

    it('实测通过时打印 PASS 与汇总', async () => {
        const report = await main({
            args: parseArgs(['node', 'script', '--output=out/report.json', '--base-url=http://127.0.0.1:3101']),
            log: silentLog,
            rootDir: directory,
            runProbes: vi.fn().mockResolvedValue({
                baseURL: 'http://127.0.0.1:3101',
                results: [{ actual: { height: 64, width: 64 }, expected: { height: 64, width: 64 }, found: true, id: 'p', ok: true, path: '/', reason: '', selector: '.p' }],
                skipReason: '',
                skipped: false,
            }),
        })

        expect(report.summary).toEqual({ failed: 0, ok: true, passed: 1, total: 1 })
        expect(silentLog.info).toHaveBeenCalledWith(expect.stringContaining('PASS p'))
        expect(process.exitCode).toBeUndefined()
    })

    it('实测失败时打印 FAIL 并置退出码 1', async () => {
        await main({
            args: parseArgs(['node', 'script', '--output=out/report.json']),
            log: silentLog,
            rootDir: directory,
            runProbes: vi.fn().mockResolvedValue({
                baseURL: 'http://127.0.0.1:3101',
                results: [{ actual: null, expected: { height: 64, width: 64 }, found: false, id: 'p', ok: false, path: '/', reason: '未找到目标元素', selector: '.p' }],
                skipReason: '',
                skipped: false,
            }),
        })

        expect(silentLog.error).toHaveBeenCalledWith(expect.stringContaining('FAIL p'))
        expect(process.exitCode).toBe(1)
    })

    it('writeReport 同时落 JSON 与 Markdown', async () => {
        const outputPath = writeReport('nested/report.json', {
            baseURL: '',
            buildEntry: 'x',
            dryRun: true,
            generatedAt: '2026-11-19T00:00:00.000Z',
            results: [],
            skipped: false,
            summary: { failed: 0, ok: true, passed: 0, total: 0 },
        }, directory)

        expect(JSON.parse(await readFile(outputPath, 'utf8')).dryRun).toBe(true)
        expect(await readFile(outputPath.replace(/\.json$/u, '.md'), 'utf8')).toContain('dry-run')
    })

    it('非法配置 JSON 直接抛错', async () => {
        const configPath = join(directory, 'bad.json')
        await writeFile(configPath, '{ broken', 'utf8')

        await expect(main({ args: parseArgs(['node', 'script', `--config=${configPath}`, '--dry-run']), log: silentLog, rootDir: directory }))
            .rejects.toThrow()
    })
})
