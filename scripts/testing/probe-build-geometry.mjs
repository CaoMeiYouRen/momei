import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

/**
 * 构建产物几何探针。
 *
 * 目的：把「开发态不可复现、只在生产构建暴露」的几何缺陷（如 `AppAvatar` 的 `xlarge` 被压回 40px）
 * 沉淀为常驻脚本。探针只读 `.output` 产物：启动生产服务 → 以 Playwright 打开页面 →
 * 对配置清单里的选择器读取 `getComputedStyle` 的宽高 → 与期望值比对并落 JSON。
 *
 * 约束：
 * - 不引入新浏览器依赖，复用既有 `playwright`；
 * - 不升为阻断门禁：`regression:weekly` 以 `required: false` 接入；
 * - `.output` 缺失时跳过并给出可读原因（weekly 在无构建产物的机器上不得误红）；
 * - `--dry-run` 只打印清单，不启动服务、不启动浏览器。
 *
 * 用法：
 * - `pnpm probe:build-geometry --dry-run`
 * - `pnpm probe:build-geometry`
 * - `pnpm probe:build-geometry -- --base-url=http://127.0.0.1:3101`（复用已启动服务）
 * - `pnpm probe:build-geometry -- --config=scripts/testing/data/build-geometry-probes.json`
 */

const repoRoot = process.cwd()
const defaultOutputRel = path.join('artifacts', 'review-gate', 'build-geometry-latest.json')
const buildEntryRel = path.join('.output', 'server', 'index.mjs')
const TEST_ADMIN = { email: 'test@momei.test', password: 'Password123' }
/** 与 Playwright 层保持同一测试密钥（仅本地 TEST_MODE 服务使用）。 */
const TEST_AUTH_SECRET = 'lhci-test-secret-0123456789abcdef'

/**
 * 默认清单。
 *
 * `large`（48px）在页面侧已无消费者（仓内唯一 `xlarge` 在 `settings/profile`，`normal` 在
 * `admin/users`）；为覆盖「三档几何」契约，`large` 用同页包装元素的 CSS 变量合成档位：
 * 克隆 `.app-avatar` 并写入 `--app-avatar-box: 48px`，读取同一份产物 CSS 的盒尺寸。
 */
export const DEFAULT_GEOMETRY_PROBES = [
    {
        id: 'settings-avatar-xlarge',
        path: '/settings',
        selector: '.avatar-preview.app-avatar',
        expected: { width: 64, height: 64 },
        requiresAuth: true,
        description: 'settings/profile xlarge 头像包装盒',
    },
    {
        id: 'admin-users-avatar-normal',
        path: '/admin/users',
        selector: '.user-info .app-avatar',
        expected: { width: 32, height: 32 },
        requiresAuth: true,
        description: 'admin/users normal 头像包装盒',
    },
    {
        id: 'settings-avatar-large-synthetic',
        path: '/settings',
        selector: '.avatar-preview.app-avatar',
        syntheticBox: '48px',
        expected: { width: 48, height: 48 },
        requiresAuth: true,
        description: 'large 档位（无页面消费者，按 CSS 契约合成）',
    },
]

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            baseUrl: '',
            buildEntry: buildEntryRel,
            config: '',
            dryRun: false,
            output: defaultOutputRel,
            port: 3101,
            timeoutMs: 30000,
        },
        flags: {
            '--dry-run': { key: 'dryRun' },
        },
        values: {
            '--base-url': { key: 'baseUrl' },
            '--build-entry': { key: 'buildEntry' },
            '--config': { key: 'config' },
            '--output': { key: 'output' },
            '--port': { key: 'port', parse: Number },
            '--timeout': { key: 'timeoutMs', parse: Number },
        },
    })
}

function assertNumber(value, label) {
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${label} 必须是正数，收到: ${value}`)
    }
}

export function normalizeExpected(expected, label = 'expected') {
    if (!expected || typeof expected !== 'object') {
        throw new Error(`${label} 缺失：每项探针必须声明期望宽高`)
    }

    const width = Number.parseFloat(expected.width)
    const height = Number.parseFloat(expected.height)
    assertNumber(width, `${label}.width`)
    assertNumber(height, `${label}.height`)

    return { width, height }
}

/**
 * 归一化探针清单：校验必填字段并把期望值转成数字。
 * 入参既可以是数组，也可以是 `{ probes: [...] }`（配置文件形态）。
 */
export function normalizeProbes(config) {
    const list = Array.isArray(config) ? config : config?.probes

    if (!Array.isArray(list) || list.length === 0) {
        throw new Error('探针清单为空：需要至少一项 `{ id, path, selector, expected }`')
    }

    const seen = new Set()
    return list.map((probe, index) => {
        const label = `probes[${index}]`
        if (!probe || typeof probe !== 'object') {
            throw new Error(`${label} 不是对象`)
        }
        if (!probe.id || typeof probe.id !== 'string') {
            throw new Error(`${label}.id 缺失`)
        }
        if (seen.has(probe.id)) {
            throw new Error(`探针 id 重复: ${probe.id}`)
        }
        seen.add(probe.id)
        if (!probe.path || !probe.path.startsWith('/')) {
            throw new Error(`${probe.id}.path 必须以 / 开头`)
        }
        if (!probe.selector || typeof probe.selector !== 'string') {
            throw new Error(`${probe.id}.selector 缺失`)
        }

        return {
            id: probe.id,
            path: probe.path,
            selector: probe.selector,
            expected: normalizeExpected(probe.expected, `${probe.id}.expected`),
            syntheticBox: typeof probe.syntheticBox === 'string' ? probe.syntheticBox : null,
            requiresAuth: probe.requiresAuth !== false,
            description: probe.description ?? '',
        }
    })
}

export function loadProbes(configPath, rootDir = repoRoot) {
    if (!configPath) {
        return normalizeProbes(DEFAULT_GEOMETRY_PROBES)
    }

    const absolutePath = path.isAbsolute(configPath) ? configPath : path.join(rootDir, configPath)
    const raw = fs.readFileSync(absolutePath, 'utf8')
    return normalizeProbes(JSON.parse(raw))
}

/** 判定单条实测结果；`found: false` 与尺寸不符都算失败，并给出可读原因。 */
export function evaluateProbe(probe, measurement) {
    if (!measurement?.found) {
        return {
            id: probe.id,
            path: probe.path,
            selector: probe.selector,
            expected: probe.expected,
            actual: null,
            found: false,
            ok: false,
            reason: '未找到目标元素',
        }
    }

    const actual = { width: measurement.width, height: measurement.height }
    const matched = actual.width === probe.expected.width && actual.height === probe.expected.height

    return {
        id: probe.id,
        path: probe.path,
        selector: probe.selector,
        expected: probe.expected,
        actual,
        found: true,
        ok: matched,
        reason: matched ? '' : `期望 ${probe.expected.width}x${probe.expected.height}，实测 ${actual.width}x${actual.height}`,
    }
}

export function summarizeResults(results) {
    const failed = results.filter((item) => !item.ok)
    return {
        total: results.length,
        passed: results.length - failed.length,
        failed: failed.length,
        ok: failed.length === 0,
    }
}

export function renderMarkdownReport(report) {
    let mode = 'real'
    if (report.dryRun) {
        mode = 'dry-run'
    } else if (report.skipped) {
        mode = 'skipped'
    }

    const lines = [
        '# 构建产物几何探针',
        '',
        `- 生成时间: ${report.generatedAt}`,
        `- 模式: ${mode}`,
        `- 服务地址: ${report.baseURL || '-'}`,
        `- 构建产物: ${report.buildEntry}`,
        '',
    ]

    if (report.skipped) {
        lines.push(`> 跳过：${report.skipReason}`)
        return `${lines.join('\n')}\n`
    }

    lines.push('| 探针 | 页面 | 期望 | 实测 | 结果 |', '|:---|:---|:---|:---|:---|')
    for (const item of report.results) {
        const actual = item.actual ? `${item.actual.width}x${item.actual.height}` : '-'
        lines.push(`| ${item.id} | ${item.path} | ${item.expected.width}x${item.expected.height} | ${actual} | ${item.ok ? 'PASS' : 'FAIL'} |`)
    }

    if (report.summary) {
        lines.push('', `汇总: ${report.summary.passed}/${report.summary.total} 通过，${report.summary.failed} 失败`)
    }

    return `${lines.join('\n')}\n`
}

export function writeReport(outputPath, report, rootDir = repoRoot) {
    const absolutePath = path.isAbsolute(outputPath) ? outputPath : path.join(rootDir, outputPath)
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
    fs.writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    const markdownPath = absolutePath.replace(/\.json$/u, '.md')
    fs.writeFileSync(markdownPath, renderMarkdownReport(report), 'utf8')
    return absolutePath
}

export async function waitForServer(baseURL, timeoutMs, deps = {}) {
    const fetchImpl = deps.fetchImpl ?? fetch
    const now = deps.now ?? (() => Date.now())
    const sleep = deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)))
    const deadline = now() + timeoutMs
    let lastError = ''

    while (now() < deadline) {
        try {
            const response = await fetchImpl(`${baseURL}/api/install/status`)
            if (response.status < 500) {
                return
            }
            lastError = `HTTP ${response.status}`
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error)
        }

        await sleep(500)
    }

    throw new Error(`服务未在 ${timeoutMs}ms 内就绪（${lastError || '无响应'}）`)
}

export async function waitForSeededAdmin(baseURL, timeoutMs, deps = {}) {
    const fetchImpl = deps.fetchImpl ?? fetch
    const now = deps.now ?? (() => Date.now())
    const sleep = deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)))
    const deadline = now() + timeoutMs

    while (now() < deadline) {
        try {
            const response = await fetchImpl(`${baseURL}/api/install/status`)
            const body = await response.json()
            if (body?.data?.installed) {
                return
            }
        } catch {
            // 种子尚未就绪，继续等待
        }
        await sleep(500)
    }

    throw new Error(`TEST_MODE 种子未在 ${timeoutMs}ms 内就绪`)
}

export async function signIn(context, baseURL, timeoutMs, deps = {}) {
    const sleep = deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)))
    const now = deps.now ?? (() => Date.now())
    const waitForSeededAdminFn = deps.waitForSeededAdmin ?? waitForSeededAdmin

    await waitForSeededAdminFn(baseURL, timeoutMs, deps)

    const deadline = now() + timeoutMs
    let lastStatus = 0

    while (now() < deadline) {
        const response = await context.request.post(`${baseURL}/api/auth/sign-in/email`, {
            headers: { 'Content-Type': 'application/json', Origin: baseURL },
            data: { ...TEST_ADMIN, rememberMe: true },
        })

        if (response.ok()) {
            return
        }

        lastStatus = response.status()
        await sleep(500)
    }

    throw new Error(`测试管理员登录失败：HTTP ${lastStatus}`)
}

export async function measureProbe(page, probe) {
    return page.evaluate(({ selector, syntheticBox }) => {
        const source = document.querySelector(selector)
        if (!(source instanceof HTMLElement)) {
            return { found: false }
        }

        let target = source
        if (syntheticBox) {
            const clone = source.cloneNode(true)
            if (!(clone instanceof HTMLElement)) {
                return { found: false }
            }
            clone.style.setProperty('--app-avatar-box', syntheticBox)
            clone.style.position = 'fixed'
            clone.style.left = '0'
            clone.style.top = '0'
            clone.style.visibility = 'hidden'
            clone.setAttribute('data-probe-synthetic', 'true')
            document.body.appendChild(clone)
            target = clone
        }

        const style = getComputedStyle(target)
        const rect = target.getBoundingClientRect()
        return {
            found: true,
            width: Number.parseFloat(style.width) || rect.width,
            height: Number.parseFloat(style.height) || rect.height,
        }
    }, { selector: probe.selector, syntheticBox: probe.syntheticBox })
}

export async function runRealProbes(options) {
    const deps = {
        chromiumImpl: chromium,
        exists: (target) => fs.existsSync(target),
        measureProbeFn: measureProbe,
        signInFn: signIn,
        spawnImpl: spawn,
        waitForServerFn: waitForServer,
        ...options.deps,
    }
    const probes = options.probes
    const buildEntry = path.isAbsolute(options.buildEntry)
        ? options.buildEntry
        : path.join(options.rootDir, options.buildEntry)

    if (!options.baseUrl && !deps.exists(buildEntry)) {
        return {
            skipped: true,
            skipReason: `构建产物不存在：${path.relative(options.rootDir, buildEntry)}（先执行 pnpm build）`,
            results: [],
        }
    }

    let serverProcess = null
    const baseURL = options.baseUrl || `http://127.0.0.1:${options.port}`

    try {
        if (!options.baseUrl) {
            serverProcess = deps.spawnImpl(process.execPath, [buildEntry], {
                cwd: options.rootDir,
                env: {
                    ...process.env,
                    AUTH_SECRET: TEST_AUTH_SECRET,
                    BETTER_AUTH_SECRET: TEST_AUTH_SECRET,
                    DISABLE_CRON_JOB: 'true',
                    HOST: '127.0.0.1',
                    MOMEI_INSTALLED: 'true',
                    NODE_ENV: 'production',
                    NUXT_PUBLIC_AUTH_BASE_URL: baseURL,
                    NUXT_PUBLIC_SITE_URL: baseURL,
                    NUXT_PUBLIC_TEST_MODE: 'true',
                    PORT: String(options.port),
                    TEST_MODE: 'true',
                },
                stdio: ['ignore', 'pipe', 'pipe'],
            })
            const logs = []
            serverProcess.stdout.on('data', (chunk) => logs.push(String(chunk)))
            serverProcess.stderr.on('data', (chunk) => logs.push(String(chunk)))
            serverProcess.on('exit', (code) => {
                if (code && code !== 0) {
                    console.warn(`[build-geometry] 服务提前退出（code=${code}）：${logs.join('').slice(-800)}`)
                }
            })
        }

        await deps.waitForServerFn(baseURL, options.timeoutMs, options.deps)

        const browser = await deps.chromiumImpl.launch()
        try {
            const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 } })
            await deps.signInFn(context, baseURL, options.timeoutMs, options.deps)
            const page = await context.newPage()
            const results = []

            for (const probe of probes) {
                await page.goto(`${baseURL}${probe.path}`, { waitUntil: 'domcontentloaded', timeout: options.timeoutMs })
                try {
                    await page.waitForSelector(probe.selector, { timeout: 15000, state: 'attached' })
                    results.push(evaluateProbe(probe, await deps.measureProbeFn(page, probe)))
                } catch (error) {
                    results.push(evaluateProbe(probe, { found: false, error: error instanceof Error ? error.message : String(error) }))
                }
            }

            return { skipped: false, skipReason: '', results, baseURL }
        } finally {
            await browser.close()
        }
    } finally {
        if (serverProcess) {
            serverProcess.kill('SIGTERM')
        }
    }
}

export async function main(options = {}) {
    const args = options.args ?? parseArgs()
    const rootDir = options.rootDir ?? repoRoot
    const log = options.log ?? console
    const runProbes = options.runProbes ?? runRealProbes

    const probes = options.probes ?? loadProbes(args.config, rootDir)
    const baseURL = args.baseUrl || `http://127.0.0.1:${args.port}`
    const buildEntry = args.buildEntry

    if (args.dryRun) {
        const report = {
            generatedAt: new Date().toISOString(),
            dryRun: true,
            skipped: false,
            baseURL,
            buildEntry,
            results: probes.map((probe) => ({
                id: probe.id,
                path: probe.path,
                selector: probe.selector,
                expected: probe.expected,
                actual: null,
                found: false,
                ok: true,
                reason: 'dry-run',
            })),
            summary: { total: probes.length, passed: probes.length, failed: 0, ok: true },
        }
        const outputPath = writeReport(args.output, report, rootDir)
        log.info(`[build-geometry] dry-run：${probes.length} 项探针`)
        for (const probe of probes) {
            log.info(`  - ${probe.id}: ${probe.path} ${probe.selector} → ${probe.expected.width}x${probe.expected.height}`)
        }
        log.info(`[build-geometry] 报告: ${path.relative(rootDir, outputPath)}`)
        return report
    }

    const outcome = await runProbes({ ...args, probes, rootDir, buildEntry, baseUrl: args.baseUrl, timeoutMs: args.timeoutMs, deps: options.deps })
    const report = {
        generatedAt: new Date().toISOString(),
        dryRun: false,
        skipped: outcome.skipped,
        skipReason: outcome.skipReason,
        baseURL: outcome.baseURL ?? baseURL,
        buildEntry,
        results: outcome.results,
        summary: summarizeResults(outcome.results),
    }
    const outputPath = writeReport(args.output, report, rootDir)

    if (outcome.skipped) {
        log.warn(`[build-geometry] 跳过：${outcome.skipReason}`)
        log.warn(`[build-geometry] 报告: ${path.relative(rootDir, outputPath)}`)
        return report
    }

    for (const item of report.results) {
        const actual = item.actual ? `${item.actual.width}x${item.actual.height}` : '-'
        const line = `${item.ok ? 'PASS' : 'FAIL'} ${item.id}: 期望 ${item.expected.width}x${item.expected.height}，实测 ${actual}`
        if (item.ok) {
            log.info(line)
        } else {
            log.error(`${line}（${item.reason}）`)
        }
    }
    log.info(`[build-geometry] ${report.summary.passed}/${report.summary.total} 通过；报告: ${path.relative(rootDir, outputPath)}`)

    if (!report.summary.ok) {
        process.exitCode = 1
    }

    return report
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
