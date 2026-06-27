import { promises as fs } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import http from 'node:http'
import { parseCliOptions } from '../shared/cli.mjs'

// ── 配置 ──────────────────────────────────────────────

/** CWV 基线采集的目标页面（公开页） */
const TARGET_URLS = [
    { name: 'home', path: '/' },
    { name: 'article-detail', path: '/posts/welcome-to-momei-demo' },
    { name: 'categories', path: '/categories' },
    { name: 'tags', path: '/tags' },
    { name: 'archives', path: '/archives' },
]

/** 每个页面的审计次数，取中位数 */
const RUNS_PER_URL = 3

const CWV_THRESHOLDS = {
    lcp: { good: 2500, poor: 4000 },
    cls: { good: 0.1, poor: 0.25 },
    tbt: { good: 200, poor: 600 },
}

// ── CLI 参数解析 ──────────────────────────────────────

function parseArgs(argv) {
    return parseCliOptions(argv, {
        defaults: {
            port: 3000,
            host: '127.0.0.1',
            output: '.lighthouseci/cwv-baseline.json',
            runs: RUNS_PER_URL,
            mode: 'dev',
            formFactor: 'desktop',
        },
        values: {
            '--port': { key: 'port', parse: Number },
            '--host': { key: 'host' },
            '--output': { key: 'output' },
            '--runs': { key: 'runs', parse: Number },
            '--mode': {
                key: 'mode',
                allowedValues: ['dev', 'prod'],
                invalidMessage: (value) => `Unsupported mode: ${value} (use 'dev' or 'prod')`,
            },
            '--form-factor': {
                key: 'formFactor',
                allowedValues: ['mobile', 'desktop'],
                invalidMessage: (value) => `Unsupported form factor: ${value} (use 'mobile' or 'desktop')`,
            },
        },
    })
}

// ── 工具函数 ──────────────────────────────────────────

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServer(host, port, timeoutMs = 120000) {
    const start = Date.now()
    // 先给 dev server 冷启动时间（避免 SSR 编译导致首次连接超时）
    await sleep(10000)
    while (Date.now() - start < timeoutMs) {
        try {
            await new Promise((resolve, reject) => {
                const req = http.get(`http://${host}:${port}/`, (res) => {
                    // 接受任何响应（包括 301/302/401），只要连接成功即可
                    res.resume()
                    resolve()
                })
                req.on('error', reject)
                req.setTimeout(5000, () => {
                    req.destroy()
                    reject(new Error('timeout'))
                })
            })
            console.info(`  Server ready at http://${host}:${port}/`)
            // 就绪后再等 5 秒让 Nuxt 完成冷编译
            await sleep(5000)
            return true
        } catch {
            await sleep(2000)
        }
    }
    throw new Error(`Server did not start within ${timeoutMs}ms at http://${host}:${port}/`)
}

function startDevServer(host, port) {
    const env = {
        ...process.env,
        DEMO_MODE: 'true',
        NUXT_PUBLIC_DEMO_MODE: 'true',
        TEST_MODE: 'true',
        NUXT_PUBLIC_TEST_MODE: 'true',
        MOMEI_INSTALLED: 'true',
        DISABLE_CRON_JOB: 'true',
        HOST: host,
        PORT: String(port),
        NUXT_PUBLIC_SITE_URL: `http://${host}:${port}`,
        NUXT_PUBLIC_AUTH_BASE_URL: `http://${host}:${port}`,
    }

    const serverProcess = spawn(
        'node',
        ['node_modules/nuxt/bin/nuxt.mjs', 'dev', '--port', String(port), '--host', host],
        { env, stdio: ['ignore', 'pipe', 'pipe'], shell: false },
    )

    let output = ''
    serverProcess.stdout.on('data', (chunk) => {
        output += chunk.toString()
    })
    serverProcess.stderr.on('data', (chunk) => {
        output += chunk.toString()
    })

    return { process: serverProcess, output }
}

function startProdServer(host, port) {
    const env = {
        ...process.env,
        DEMO_MODE: 'true',
        NUXT_PUBLIC_DEMO_MODE: 'true',
        TEST_MODE: 'true',
        NUXT_PUBLIC_TEST_MODE: 'true',
        MOMEI_INSTALLED: 'true',
        DISABLE_CRON_JOB: 'true',
        HOST: host,
        AUTH_SECRET: 'cwv-baseline-test-secret-0123456789',
        BETTER_AUTH_SECRET: 'cwv-baseline-test-secret-0123456789',
        PORT: String(port),
        NUXT_PUBLIC_SITE_URL: `http://${host}:${port}`,
        NUXT_PUBLIC_AUTH_BASE_URL: `http://${host}:${port}`,
    }

    const serverProcess = spawn('node', ['.output/server/index.mjs'], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
    })

    let output = ''
    serverProcess.stdout.on('data', (chunk) => {
        output += chunk.toString()
    })
    serverProcess.stderr.on('data', (chunk) => {
        output += chunk.toString()
    })

    return { process: serverProcess, output }
}

// ── lhci CLI 封装 ─────────────────────────────────────

function resolveLhciBin() {
    const cliPath = path.resolve(
        'node_modules/.pnpm/@lhci+cli@0.15.1/node_modules/@lhci/cli/src/cli.js',
    )
    return `node ${cliPath}`
}

async function runLhciCollect(url, host, port, runs, workDir, formFactor = 'desktop') {
    const fullUrl = `http://${host}:${port}${url}`
    const lhciBin = resolveLhciBin()

    return new Promise((resolve, reject) => {
        const isMobile = formFactor === 'mobile'
        const args = [
            'collect',
            `--url=${fullUrl}`,
            `--numberOfRuns=${runs}`,
            '--settings.chromeFlags=--headless=new --no-sandbox --disable-gpu',
            `--settings.formFactor=${formFactor}`,
            '--settings.screenEmulation.disabled=true',
            `--settings.throttling.cpuSlowdownMultiplier=${isMobile ? 4 : 1}`,
        ]

        if (isMobile) {
            args.push('--settings.throttling.rttMs=150')
            args.push('--settings.throttling.throughputKbps=1.6 * 1024')
        }

        const child = spawn(lhciBin, args, {
            cwd: workDir,
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true,
        })

        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString()
        })
        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString()
        })

        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`lhci collect failed (code ${code}): ${stderr || stdout}`))
                return
            }
            resolve({ stdout, stderr })
        })

        child.on('error', reject)
    })
}

// ── CWV 指标提取 ─────────────────────────────────────

async function readLhrFiles(lhciDir) {
    const files = await fs.readdir(lhciDir)
    const lhrFiles = files
        .filter((f) => f.startsWith('lhr-') && f.endsWith('.json'))
        .sort()

    const results = []
    for (const file of lhrFiles) {
        const content = await fs.readFile(path.join(lhciDir, file), 'utf8')
        try {
            results.push(JSON.parse(content))
        } catch {
            console.warn(`  Warning: Could not parse ${file}`)
        }
    }
    return results
}

async function clearLhrFiles(lhciDir) {
    try {
        const files = await fs.readdir(lhciDir)
        for (const file of files) {
            if (file.startsWith('lhr-') && file.endsWith('.json')) {
                await fs.unlink(path.join(lhciDir, file))
            }
        }
    } catch {
        // 目录不存在则忽略
    }
}

function rateMetric(value, thresholds) {
    if (value === null || value === undefined) {
        return 'not-measured'
    }
    if (value <= thresholds.good) {
        return 'good'
    }
    if (value <= thresholds.poor) {
        return 'needs-improvement'
    }
    return 'poor'
}

function extractCwvMetrics(lhr, url) {
    const audits = lhr.audits || {}

    return {
        url,
        performanceScore: Math.round((lhr.categories?.performance?.score ?? 0) * 100),
        accessibilityScore: Math.round((lhr.categories?.accessibility?.score ?? 0) * 100),
        bestPracticesScore: Math.round((lhr.categories?.['best-practices']?.score ?? 0) * 100),
        seoScore: Math.round((lhr.categories?.seo?.score ?? 0) * 100),
        metrics: {
            lcp: {
                value: audits['largest-contentful-paint']?.numericValue ?? null,
                displayValue: audits['largest-contentful-paint']?.displayValue ?? null,
                rating: rateMetric(
                    audits['largest-contentful-paint']?.numericValue ?? null,
                    CWV_THRESHOLDS.lcp,
                ),
            },
            cls: {
                value: audits['cumulative-layout-shift']?.numericValue ?? null,
                displayValue: audits['cumulative-layout-shift']?.displayValue ?? null,
                rating: rateMetric(
                    audits['cumulative-layout-shift']?.numericValue ?? null,
                    CWV_THRESHOLDS.cls,
                ),
            },
            tbt: {
                value: audits['total-blocking-time']?.numericValue ?? null,
                displayValue: audits['total-blocking-time']?.displayValue ?? null,
                rating: rateMetric(
                    audits['total-blocking-time']?.numericValue ?? null,
                    CWV_THRESHOLDS.tbt,
                ),
            },
            fcp: {
                value: audits['first-contentful-paint']?.numericValue ?? null,
                displayValue: audits['first-contentful-paint']?.displayValue ?? null,
            },
            si: {
                value: audits['speed-index']?.numericValue ?? null,
                displayValue: audits['speed-index']?.displayValue ?? null,
            },
            tti: {
                value: audits['interactive']?.numericValue ?? null,
                displayValue: audits['interactive']?.displayValue ?? null,
            },
        },
        diagnostics: {
            totalByteWeight: audits['total-byte-weight']?.numericValue ?? null,
            domSize: audits['dom-size']?.numericValue ?? null,
            renderBlockingResources: audits['render-blocking-resources']?.details?.items?.length ?? null,
        },
    }
}

function median(values) {
    if (values.length === 0) {
        return null
    }
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function aggregateRuns(runs) {
    if (runs.length === 0) {
        return null
    }

    return {
        url: runs[0].url,
        performanceScore: median(runs.map((r) => r.performanceScore)),
        accessibilityScore: median(runs.map((r) => r.accessibilityScore)),
        bestPracticesScore: median(runs.map((r) => r.bestPracticesScore)),
        seoScore: median(runs.map((r) => r.seoScore)),
        lcpValue: median(runs.map((r) => r.metrics.lcp.value).filter((v) => v !== null)),
        clsValue: median(runs.map((r) => r.metrics.cls.value).filter((v) => v !== null)),
        tbtValue: median(runs.map((r) => r.metrics.tbt.value).filter((v) => v !== null)),
        runs,
    }
}

// ── 主流程 ────────────────────────────────────────────

async function main() {
    const args = parseArgs(process.argv)

    const modeLabel = args.mode === 'dev' ? 'Nuxt Dev (dev mode)' : 'Nuxt Prod (.output/server)'
    const formFactorLabel = args.formFactor === 'mobile' ? 'Mobile (4G throttling)' : 'Desktop (no throttling)'
    console.info('=== CWV Baseline Collection ===')
    console.info(`Mode: ${modeLabel}`)
    console.info(`Form Factor: ${formFactorLabel}`)
    console.info(`Target: ${TARGET_URLS.length} pages, ${args.runs} runs each`)
    if (args.mode === 'dev') {
        console.info('Note: Dev mode metrics include HMR/dev overhead and may differ from production.')
    }
    console.info('')

    const lhciDir = path.resolve('.lighthouseci')
    await fs.mkdir(lhciDir, { recursive: true })

    // 启动服务器
    console.info('Starting server...')
    let server
    if (args.mode === 'dev') {
        server = startDevServer(args.host, args.port)
    } else {
        await fs.access('.output/server/index.mjs')
        server = startProdServer(args.host, args.port)
    }

    await waitForServer(args.host, args.port)
    console.info('')

    try {
        const results = {}

        for (const target of TARGET_URLS) {
            const label = `${target.name} (${target.path})`
            console.info(`Auditing: ${label}`)

            await clearLhrFiles(lhciDir)

            console.info(`  Running lhci collect (${args.runs} runs, ${args.formFactor})...`)
            try {
                await runLhciCollect(target.path, args.host, args.port, args.runs, process.cwd(), args.formFactor)
            } catch (err) {
                console.warn(`  Failed: ${err.message}`)
                results[target.name] = {
                    url: `http://${args.host}:${args.port}${target.path}`,
                    error: err.message,
                    runs: [],
                }
                continue
            }

            const lhrs = await readLhrFiles(lhciDir)
            if (lhrs.length === 0) {
                console.warn(`  Warning: No LHR files generated`)
                results[target.name] = {
                    url: `http://${args.host}:${args.port}${target.path}`,
                    error: 'No LHR files found',
                    runs: [],
                }
                continue
            }

            const runs = lhrs.map((lhr) => extractCwvMetrics(lhr, `http://${args.host}:${args.port}${target.path}`))

            runs.forEach((run, i) => {
                console.info(
                    `  Run ${i + 1}: Perf=${run.performanceScore} LCP=${run.metrics.lcp.displayValue ?? 'N/A'} CLS=${run.metrics.cls.displayValue ?? 'N/A'} TBT=${run.metrics.tbt.displayValue ?? 'N/A'}`,
                )
            })

            results[target.name] = aggregateRuns(runs)
            console.info('')
        }

        const report = {
            timestamp: new Date().toISOString(),
            mode: args.mode,
            formFactor: args.formFactor,
            environment: {
                host: args.host,
                port: args.port,
                runsPerUrl: args.runs,
                cwvThresholds: CWV_THRESHOLDS,
            },
            pages: results,
            summary: {},
        }

        for (const [key, page] of Object.entries(results)) {
            report.summary[key] = {
                performance: page.performanceScore,
                lcp: page.lcpValue,
                cls: page.clsValue,
                tbt: page.tbtValue,
                error: page.error ?? null,
            }
        }

        await fs.mkdir(path.dirname(path.resolve(args.output)), { recursive: true })
        await fs.writeFile(path.resolve(args.output), JSON.stringify(report, null, 2), 'utf8')

        console.info('=== CWV Baseline Summary ===')
        for (const [key, summary] of Object.entries(report.summary)) {
            if (summary.error) {
                console.info(`  ${key.padEnd(20)} ERROR: ${summary.error}`)
                continue
            }
            const lcp = summary.lcp !== null ? `${(summary.lcp / 1000).toFixed(2)}s` : 'N/A'
            const cls = summary.cls !== null ? summary.cls.toFixed(3) : 'N/A'
            const tbt = summary.tbt !== null ? `${summary.tbt.toFixed(0)}ms` : 'N/A'
            let rating = '⚪'
            if (summary.performance !== null) {
                if (summary.performance >= 90) {
                    rating = '🟢'
                } else if (summary.performance >= 60) {
                    rating = '🟡'
                } else {
                    rating = '🔴'
                }
            }
            console.info(`  ${rating} ${key.padEnd(20)} Perf=${summary.performance} LCP=${lcp} CLS=${cls} TBT=${tbt}`)
        }

        console.info(`\nBaseline report written to: ${args.output}`)
    } finally {
        server.process.kill('SIGTERM')
        setTimeout(() => {
            if (!server.process.killed) {
                server.process.kill('SIGKILL')
            }
        }, 5000)
    }
}

main().catch((error) => {
    console.error(`[cwv-baseline] ${error.message}`)
    process.exit(1)
})
