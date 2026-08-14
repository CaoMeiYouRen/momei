/**
 * 清理本地临时文件与构建产物
 *
 * 用途：开发过程中会在项目内留下大量可再生的构建 / 测试产物与一次性临时文件，
 * 本脚本按 tier 分级清理，默认 dry-run（只输出计划，不执行删除）。
 *
 * tier 分级：
 *   - safe  构建 / 测试产物：删除后重新运行对应命令即可重建（默认包含）
 *   - logs  日志与一次性运行痕迹（默认包含）
 *   - audit 已沉淀结论的一次性调研数据，需显式指定
 *   - deep  依赖目录，删除后必须重新安装，需显式指定
 *
 * 保护策略（永不删除）：
 *   - `.env*` 环境配置、`.session/` 会话状态
 *   - `artifacts/` 下的 `review-gate/`、`governance/`、`security/`、`testing/` 等证据目录
 *   - `artifacts/` 根级散落文件（可能被 docs 引用为证据，仅提示不自动清理）
 *   - `research-output/`、`opc-doc/`、`.opencode/` 的配置与链接部分
 *
 * 用法：
 *   node scripts/maintenance/cleanup-temp.mjs
 *   node scripts/maintenance/cleanup-temp.mjs --tier=safe,logs,audit --apply
 *   node scripts/maintenance/cleanup-temp.mjs --keep-logs-days=30 --apply
 */
import { readdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { ensureAllowedValue, isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(__dirname, '..', '..')

export const TIER_ORDER = ['safe', 'logs', 'audit', 'deep']
export const DEFAULT_TIERS = ['safe', 'logs']

export const TIER_DESCRIPTIONS = {
    safe: '构建 / 测试产物（重新运行对应命令即可重建）',
    logs: '日志与一次性运行痕迹',
    audit: '已沉淀结论的一次性调研数据',
    deep: '依赖目录（删除后必须重新安装）',
}

/** 目录型清理条目：整目录删除 */
export const DIR_ENTRIES = [
    // tier: safe —— 构建 / 测试产物
    { tier: 'safe', relPath: '.output', description: 'Nuxt 生产构建产物（pnpm build 重建）' },
    { tier: 'safe', relPath: '.nuxt', description: 'Nuxt dev 构建缓存（pnpm dev/build 重建）' },
    { tier: 'safe', relPath: '.data', description: 'Nuxt 数据目录（自动重建）' },
    { tier: 'safe', relPath: 'docs/.vitepress/dist', description: 'VitePress 文档构建产物（pnpm docs:build 重建）' },
    { tier: 'safe', relPath: 'docs/.vitepress/cache', description: 'VitePress 依赖缓存（自动重建）' },
    { tier: 'safe', relPath: '.vercel/output', description: 'Vercel 构建产物（vercel build 重建）' },
    { tier: 'safe', relPath: 'coverage', description: '根测试覆盖率产物（pnpm test:coverage 重建）' },
    { tier: 'safe', relPath: 'playwright-report', description: 'Playwright 报告（pnpm test:e2e 重建）' },
    { tier: 'safe', relPath: 'test-results', description: 'Playwright 测试结果（pnpm test:e2e 重建）' },
    { tier: 'safe', relPath: '.lighthouseci', description: 'Lighthouse CI 运行产物（pnpm test:perf 重建）' },
    { tier: 'safe', relPath: 'packages/api-client/dist', description: 'api-client 构建产物（包 build 重建）' },
    { tier: 'safe', relPath: 'packages/mcp-server/dist', description: 'mcp-server 构建产物（包 build 重建）' },
    { tier: 'safe', relPath: 'packages/cli/dist', description: 'cli 构建产物（包 build 重建）' },
    { tier: 'safe', relPath: 'packages/api-client/coverage', description: 'api-client 测试覆盖率产物' },
    { tier: 'safe', relPath: 'packages/mcp-server/coverage', description: 'mcp-server 测试覆盖率产物' },
    { tier: 'safe', relPath: 'packages/cli/coverage', description: 'cli 测试覆盖率产物' },
    { tier: 'safe', relPath: 'packages/api-client/.nuxt', description: 'api-client Nuxt 缓存（自动重建）' },
    // tier: logs —— 日志与一次性运行痕迹
    { tier: 'logs', relPath: 'packages/api-client/logs', description: 'api-client 测试运行日志' },
    { tier: 'logs', relPath: 'tmp', description: 'UI 验证临时截图' },
    { tier: 'logs', relPath: '.playwright-mcp', description: 'Playwright MCP 日志' },
    // tier: audit —— 已沉淀结论的一次性调研数据
    { tier: 'audit', relPath: 'artifacts/pg-observe-data', description: 'PG 数据目录快照（调研结论已沉淀至 review-gate）' },
    { tier: 'audit', relPath: 'artifacts/postgres-hot-read-sample', description: 'PG 热读采样数据（调研结论已沉淀）' },
    { tier: 'audit', relPath: 'artifacts/dup-probe', description: 'jscpd 重复代码探针数据' },
    // tier: deep —— 依赖目录
    { tier: 'deep', relPath: 'node_modules', description: '根依赖目录（需 pnpm install 恢复）' },
    { tier: 'deep', relPath: '.opencode/node_modules', description: 'opencode 本地扩展依赖（需重新安装恢复）' },
]

/** 文件型清理条目：整文件删除 */
export const FILE_ENTRIES = [
    { tier: 'logs', relPath: 'nuxt-dev.log', description: 'Nuxt dev 日志' },
    { tier: 'logs', relPath: 'nuxt-dev-error.log', description: 'Nuxt dev 错误日志' },
]

/** 日志目录内按保留天数滚动清理的文件名模式 */
export const LOG_FILE_PATTERNS = [/\.log$/i]

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            tier: [...DEFAULT_TIERS],
            apply: false,
            keepLogsDays: 14,
        },
        flags: {
            '--apply': { key: 'apply' },
        },
        values: {
            '--tier': {
                key: 'tier',
                collect: (current, value) => {
                    const parts = value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                    if (parts.length === 0) {
                        throw new Error(`[cleanup-temp] --tier 缺少取值，可选值: ${TIER_ORDER.join(', ')}`)
                    }
                    for (const part of parts) {
                        ensureAllowedValue(
                            part,
                            TIER_ORDER,
                            (invalid) => `[cleanup-temp] 不支持的 tier: ${invalid}，可选值: ${TIER_ORDER.join(', ')}`,
                        )
                    }
                    return [...new Set([...(current ?? []), ...parts])]
                },
            },
            '--keep-logs-days': {
                key: 'keepLogsDays',
                parse: (value) => {
                    const days = Number(value)
                    if (!Number.isInteger(days) || days < 0) {
                        throw new Error('[cleanup-temp] --keep-logs-days 必须是大于等于 0 的整数')
                    }
                    return days
                },
            },
        },
    })
}

export function formatBytes(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function getPathSize(absPath, concurrency = 64) {
    try {
        const fileStat = await stat(absPath)
        if (fileStat.isFile()) {
            return fileStat.size
        }
        const entries = await readdir(absPath, { withFileTypes: true })
        let index = 0
        let total = 0
        const workerCount = Math.min(concurrency, Math.max(entries.length, 1))
        const workers = Array.from({ length: workerCount }, async () => {
            while (index < entries.length) {
                const entry = entries[index]
                index += 1
                const childPath = path.join(absPath, entry.name)
                if (entry.isDirectory()) {
                    // 注意：不能写成 `total += await ...`，await 之前的左操作数读取
                    // 会让出事件循环，多个 worker 恢复后会用旧值互相覆盖（read-modify-write 竞态）
                    const childSize = await getPathSize(childPath, concurrency)
                    total += childSize ?? 0
                } else if (entry.isFile()) {
                    const fileStat = await stat(childPath)
                    total += fileStat.size
                }
            }
        })
        await Promise.all(workers)
        return total
    } catch {
        return null
    }
}

async function pathExists(absPath) {
    try {
        await stat(absPath)
        return true
    } catch {
        return false
    }
}

/**
 * 构建清理计划：返回将删除的条目列表与提示信息，不执行任何删除。
 * @param {object} options
 * @param {string} [options.root] 仓库根目录
 * @param {string[]} [options.tiers] 启用的 tier 列表
 * @param {number} [options.keepLogsDays] logs/ 目录内日志保留天数
 * @returns {Promise<{ items: Array<object>, warnings: string[] }>}
 */
export async function buildCleanupPlan({ root = repoRoot, tiers = DEFAULT_TIERS, keepLogsDays = 14 } = {}) {
    const tierSet = new Set(tiers)
    const items = []
    const warnings = []

    for (const entry of DIR_ENTRIES) {
        if (!tierSet.has(entry.tier)) {
            continue
        }
        const absPath = path.join(root, entry.relPath)
        const sizeBytes = await getPathSize(absPath)
        if (sizeBytes === null) {
            continue
        }
        items.push({ ...entry, kind: 'dir', sizeBytes, absPath })
    }

    for (const entry of FILE_ENTRIES) {
        if (!tierSet.has(entry.tier)) {
            continue
        }
        const absPath = path.join(root, entry.relPath)
        const sizeBytes = await getPathSize(absPath)
        if (sizeBytes === null) {
            continue
        }
        items.push({ ...entry, kind: 'file', sizeBytes, absPath })
    }

    // logs/ 目录内按保留天数滚动清理，非日志文件（如 .audit.json）一律保留
    if (tierSet.has('logs')) {
        const logsDir = path.join(root, 'logs')
        if (await pathExists(logsDir)) {
            const cutoff = Date.now() - keepLogsDays * 24 * 60 * 60 * 1000
            const entries = await readdir(logsDir, { withFileTypes: true })
            for (const entry of entries) {
                if (!entry.isFile() || !LOG_FILE_PATTERNS.some((pattern) => pattern.test(entry.name))) {
                    continue
                }
                const absPath = path.join(logsDir, entry.name)
                const fileStat = await stat(absPath)
                if (fileStat.mtimeMs >= cutoff) {
                    continue
                }
                items.push({
                    tier: 'logs',
                    relPath: path.join('logs', entry.name),
                    kind: 'file',
                    sizeBytes: fileStat.size,
                    absPath,
                    description: `滚动日志（超过 ${keepLogsDays} 天）`,
                })
            }
        }
    }

    // artifacts/ 根级散落文件可能被 docs 引用为证据，只提示不自动清理
    const artifactsDir = path.join(root, 'artifacts')
    let looseCount = 0
    let looseBytes = 0
    if (await pathExists(artifactsDir)) {
        for (const entry of await readdir(artifactsDir, { withFileTypes: true })) {
            if (!entry.isFile()) {
                continue
            }
            const absPath = path.join(artifactsDir, entry.name)
            looseCount += 1
            looseBytes += (await stat(absPath)).size
        }
    }
    if (looseCount > 0) {
        warnings.push(
            `artifacts/ 根级有 ${looseCount} 个散落文件（约 ${formatBytes(looseBytes)}），可能被 docs 引用为证据，未纳入自动清理；如需清理请人工审查后再处理`,
        )
    }

    return { items, warnings }
}

export async function main(argv = process.argv) {
    const options = parseArgs(argv)
    const { items, warnings } = await buildCleanupPlan({
        tiers: options.tier,
        keepLogsDays: options.keepLogsDays,
    })
    const totalBytes = items.reduce((sum, item) => sum + item.sizeBytes, 0)
    const apply = options.apply

    console.log(
        `[cleanup-temp] ${apply ? '开始清理' : '清理计划（dry-run，未执行删除）'} tier=${options.tier.join(',')} keep-logs-days=${options.keepLogsDays}`,
    )
    for (const tier of TIER_ORDER) {
        const tierItems = items.filter((item) => item.tier === tier)
        if (tierItems.length === 0) {
            continue
        }
        console.log(`\n[${tier}] ${TIER_DESCRIPTIONS[tier]}`)
        for (const item of tierItems) {
            console.log(`  - ${item.relPath.padEnd(52)} ${formatBytes(item.sizeBytes).padStart(10)}  ${item.description}`)
        }
    }
    console.log(`\n合计: ${items.length} 项 / 约 ${formatBytes(totalBytes)}`)
    for (const warning of warnings) {
        console.log(`[warn] ${warning}`)
    }

    if (!apply) {
        console.log('\n提示: 确认无误后使用 --apply 执行删除；可用 --tier 扩展范围（safe,logs,audit,deep）。')
        return 0
    }

    let failed = 0
    for (const item of items) {
        try {
            await rm(item.absPath, { recursive: true, force: true })
            console.log(`[ok] 已删除 ${item.relPath}（${formatBytes(item.sizeBytes)}）`)
        } catch (error) {
            failed += 1
            console.log(`[warn] 删除失败 ${item.relPath}: ${error.message}（可能被进程占用，跳过）`)
        }
    }
    if (failed > 0) {
        console.log(`[warn] ${failed} 项删除失败，请关闭占用进程后重试`)
        return 1
    }
    console.log(`[done] 已释放约 ${formatBytes(totalBytes)}`)
    return 0
}

if (isDirectExecution(import.meta.url)) {
    process.exitCode = await main()
}
