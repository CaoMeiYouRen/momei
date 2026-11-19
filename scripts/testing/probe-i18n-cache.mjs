import process from 'node:process'

/**
 * 首页 / 前缀路由的响应头探针（可复跑）。
 *
 * 用途：确认「关闭 i18n 的 SSR 偏好 cookie」后，`/` 不再返回 `Set-Cookie` 并进入既有 SWR；
 * 同时保留 `cf-cache-status` 字段，便于把边缘命中结论单独核对（仓库内不保证边缘行为）。
 *
 * 用法：
 * - `pnpm probe:i18n-cache --base-url=https://momei.app`
 * - 默认 `http://127.0.0.1:3000`；`--output` 可指定 JSON 落盘路径。
 */

export const DEFAULT_BASE_URL = 'http://127.0.0.1:3000'
export const DEFAULT_OUTPUT = 'artifacts/review-gate/i18n-cache-probe-latest.json'

export const DEFAULT_TARGETS = [
    { path: '/', name: 'root' },
    { path: '/en-US', name: 'en-US' },
    { path: '/robots.txt', name: 'robots' },
]

const HEADER_KEYS = ['set-cookie', 'cache-control', 'cf-cache-status', 'age', 'location', 'vary']

function readHeader(headers, key) {
    const value = headers?.get?.(key) ?? headers?.[key] ?? null

    return value ?? null
}

async function probeTarget(fetchImpl, baseURL, target) {
    const url = new URL(target.path, baseURL).toString()
    const response = await fetchImpl(url, { redirect: 'manual' })

    return {
        ...target,
        headers: Object.fromEntries(HEADER_KEYS.map((key) => [key, readHeader(response.headers, key)])),
        status: response.status,
        url,
    }
}

export async function collectI18nCacheProbe(options = {}) {
    const baseURL = options.baseURL ?? DEFAULT_BASE_URL
    const fetchImpl = options.fetchImpl ?? fetch
    const targets = options.targets ?? DEFAULT_TARGETS
    const results = []

    for (const target of targets) {
        results.push(await probeTarget(fetchImpl, baseURL, target))
    }

    const root = results.find((item) => item.name === 'root')
    const checks = [
        { name: 'root-no-set-cookie', ok: !root?.headers['set-cookie'] },
        { name: 'root-cacheable', ok: Boolean(root?.headers['cache-control']?.includes('s-maxage')) },
    ]

    return {
        baseURL,
        checks,
        generatedAt: new Date().toISOString(),
        ok: checks.every((check) => check.ok),
        results,
    }
}

function parseArg(argv, name, fallback) {
    const prefix = `${name}=`
    const entry = argv.find((item) => item.startsWith(prefix))

    return entry ? entry.slice(prefix.length) : fallback
}

export async function main(argv = process.argv) {
    const baseURL = parseArg(argv, '--base-url', DEFAULT_BASE_URL)
    const output = parseArg(argv, '--output', DEFAULT_OUTPUT)
    const report = await collectI18nCacheProbe({ baseURL })

    for (const item of report.results) {
        console.info(`[i18n-cache] ${item.path} -> ${item.status}`)
        for (const [key, value] of Object.entries(item.headers)) {
            console.info(`  ${key}: ${value ?? '-'}`)
        }
    }

    for (const check of report.checks) {
        console.info(`[i18n-cache] ${check.ok ? 'PASS' : 'FAIL'} ${check.name}`)
    }

    if (output) {
        const { mkdir, writeFile } = await import('node:fs/promises')
        const path = await import('node:path')
        const target = path.isAbsolute(output) ? output : path.join(process.cwd(), output)

        await mkdir(path.dirname(target), { recursive: true })
        await writeFile(target, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
        console.info(`[i18n-cache] 报告: ${output}`)
    }

    if (!report.ok) {
        process.exitCode = 1
    }

    return report
}

if (process.argv[1] && process.argv[1].endsWith('probe-i18n-cache.mjs')) {
    await main()
}
