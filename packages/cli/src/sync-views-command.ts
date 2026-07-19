/**
 * CLI sync-views command: momei sync-views <file>
 *
 * 从 D1 (hexo-cloudflare-counter) 导出的阅读量数据同步到 Momei 的 PostgreSQL。
 *
 * D1 表结构（counters）：
 *   url    TEXT  — 页面路径，如 /archives/<slug>.html
 *   time   INTEGER — 阅读量（D1 中阅读量字段名为 time）
 *   title  TEXT  — 文章标题
 *
 * 输入文件格式：JSON 数组，每项包含 url 和 time（或 views）字段。
 *
 * 导出示例（wrangler d1 execute 的 --json 模式）：
 *   wrangler d1 execute hexo-cloudflare-counter --command "SELECT url, time FROM counters WHERE time > 0" --json
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { CAC } from 'cac'
import chalk from 'chalk'
import ora from 'ora'
import { MomeiApiClient } from './api-client'

// ===== Types =====

interface D1ViewEntry {
    url: string
    time?: number
    views?: number
    [key: string]: unknown
}

interface SyncViewsEntryResult {
    url: string
    slug: string | null
    status: 'synced' | 'skipped' | 'not-found' | 'error'
    message: string
}

interface SyncViewsResponse {
    synced: number
    skipped: number
    notFound: number
    errors: number
    total: number
    details: SyncViewsEntryResult[]
}

interface SyncViewsCliOptions {
    apiUrl: string
    apiKey?: string
    dryRun?: boolean
    verbose?: boolean
    rateLimit?: number | string
    maxRetries?: number | string
}

/**
 * 从 D1 条目中提取阅读量。
 * D1 schema 中阅读量字段名为 time，也兼容常见的 views 字段名。
 * 支持数字和数字字符串两种格式。
 */
function extractViews(entry: D1ViewEntry): number | undefined {
    const rawTime = entry.time
    const rawViews = entry.views

    const time = typeof rawTime === 'number' ? rawTime
        : typeof rawTime === 'string' ? Number(rawTime)
        : undefined
    if (time !== undefined && !Number.isNaN(time) && time >= 0) {
        return time
    }

    const views = typeof rawViews === 'number' ? rawViews
        : typeof rawViews === 'string' ? Number(rawViews)
        : undefined
    if (views !== undefined && !Number.isNaN(views) && views >= 0) {
        return views
    }

    return undefined
}

// ===== Command =====

async function runSyncViews(file: string, options: SyncViewsCliOptions) {
    const { apiUrl, apiKey, dryRun, verbose } = options
    const rateLimiterOptions = {
        rps: Number.parseInt(String(options.rateLimit), 10) || 5,
        concurrency: 3,
        maxRetries: Number.parseInt(String(options.maxRetries), 10) || 3,
    }

    if (!apiKey) {
        console.error(chalk.red('Error: --api-key is required'))
        process.exitCode = 1
        return
    }

    const filePath = resolve(process.cwd(), file)
    console.log(chalk.blue('\n📊 Sync Views from D1\n'))
    console.log(chalk.gray(`File: ${filePath}`))
    console.log(chalk.gray(`API URL: ${apiUrl}`))
    console.log(chalk.gray(`Dry Run: ${dryRun ? 'Yes' : 'No'}\n`))

    // 读取并解析 JSON 文件
    let rawEntries: unknown[]
    try {
        const content = await readFile(filePath, 'utf-8')
        const parsed = JSON.parse(content)

        // wrangler d1 execute --json 输出格式：
        //   1) [{ results: [...], success: true, meta: {...} }]  — 数组包对象
        //   2) { results: [...], success: true, meta: {...} }     — 裸对象
        //   3) [{ url: "...", time: 123 }, ...]                  — 裸数组
        if (Array.isArray(parsed)) {
            // 情况 1：数组包对象，取第一个元素的 results
            if (parsed.length === 1 && parsed[0] && typeof parsed[0] === 'object' && 'results' in parsed[0]) {
                const innerResults = (parsed[0] as Record<string, unknown>).results
                if (Array.isArray(innerResults)) {
                    rawEntries = innerResults
                } else {
                    rawEntries = parsed
                }
            } else {
                // 情况 3：裸数组
                rawEntries = parsed
            }
        } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).results)) {
            // 情况 2：裸对象
            rawEntries = (parsed as Record<string, unknown>).results as unknown[]
        } else {
            throw new Error('JSON 文件必须是数组、包含 results 数组的对象（wrangler d1 execute 输出格式），或裸条目数组')
        }
    } catch (error) {
        console.error(chalk.red(`\nError: 无法读取文件: ${error instanceof Error ? error.message : 'Unknown error'}`))
        process.exitCode = 1
        return
    }

    const entries = rawEntries as D1ViewEntry[]

    // 过滤出有效的条目（必须有 url 和 有效的阅读量）
    // D1 的 wrangler d1 execute --json 输出中包含 url 和 time 字段
    const validEntries = entries.filter((e) => {
        const views = extractViews(e)
        return typeof e.url === 'string' && e.url.length > 0
            && views !== undefined && views >= 0
    })

    console.log(chalk.gray(`Total entries: ${entries.length}`))
    console.log(chalk.gray(`Valid entries: ${validEntries.length}`))
    console.log(chalk.gray(`Invalid entries: ${entries.length - validEntries.length}`))

    // 诊断：显示第一条无效条目的结构
    if (verbose && entries.length > 0 && validEntries.length === 0) {
        const sample = entries[0]
        if (!sample) return
        console.log(chalk.gray(`\nFirst entry sample:`))
        console.log(chalk.gray(`  url: ${JSON.stringify(sample.url)} (${typeof sample.url})`))
        console.log(chalk.gray(`  time: ${JSON.stringify(sample.time)} (${typeof sample.time})`))
        console.log(chalk.gray(`  views: ${JSON.stringify(sample.views)} (${typeof sample.views})`))
        console.log(chalk.gray(`  keys: ${Object.keys(sample as object).join(', ')}`))
    }

    console.log()

    if (validEntries.length === 0) {
        console.log(chalk.yellow('No valid entries found. Nothing to sync.'))
        return
    }

    if (dryRun) {
        console.log(chalk.yellow('\n✓ Dry run completed. No data was synced.\n'))
        console.log(chalk.gray('Entries that would be synced:'))
        for (const entry of validEntries.slice(0, 10)) {
            const views = extractViews(entry)!
            console.log(chalk.gray(`  ${entry.url} → ${views} views`))
        }
        if (validEntries.length > 10) {
            console.log(chalk.gray(`  ... and ${validEntries.length - 10} more`))
        }
        return
    }

    // 调用 API 同步
    const spinner = ora('Syncing views...').start()
    const client = new MomeiApiClient(apiUrl, apiKey, rateLimiterOptions)

    try {
        // 保持原始字段名传给服务端（time 或 views），由服务端解析
        // 统一将阅读量映射为 views 字段发送给服务端
        const rawEntries = validEntries.map((e) => ({
            url: e.url,
            views: extractViews(e)!,
        }))
        const response = await client.api.client.post<SyncViewsResponse>('/api/external/posts/sync-views', {
            entries: rawEntries,
        })

        spinner.succeed(chalk.green('Sync completed\n'))

        const data = response.data

        // 显示汇总
        console.log(chalk.blue('📊 Sync Summary:\n'))
        console.log(chalk.green(`  ✓ Synced: ${data.synced}`))
        console.log(chalk.yellow(`  ↷ Skipped (already has views): ${data.skipped}`))
        console.log(chalk.gray(`  ? Not Found: ${data.notFound}`))
        console.log(chalk.red(`  ✗ Errors: ${data.errors}`))
        console.log(chalk.gray(`  Total: ${data.total}\n`))

        // 显示详细信息
        if (verbose && data.details.length > 0) {
            const errors = data.details.filter((d) => d.status === 'error')
            const notFound = data.details.filter((d) => d.status === 'not-found')

            if (errors.length > 0) {
                console.log(chalk.red('Errors:'))
                for (const detail of errors) {
                    console.log(chalk.red(`  - ${detail.url}: ${detail.message}`))
                }
                console.log()
            }

            if (notFound.length > 0) {
                console.log(chalk.gray('Not found:'))
                for (const detail of notFound) {
                    console.log(chalk.gray(`  - ${detail.url}`))
                }
                console.log()
            }
        }
    } catch (error) {
        spinner.fail(chalk.red('Failed to sync views'))
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error(chalk.red(`\nError: ${message}`))
        process.exitCode = 1
    }
}

// ===== Register =====

export function registerSyncViewsCommand(cli: CAC): void {
    cli
        .command('sync-views <file>', 'Sync view counts from D1 export to Momei')
        .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
        .option('--api-key <key>', 'Momei API Key (required)')
        .option('--dry-run', 'Parse file without syncing', { default: false })
        .option('--rate-limit <num>', 'Max requests per second', { default: 5 })
        .option('--max-retries <num>', 'Max retries on 429 errors', { default: 3 })
        .option('--verbose', 'Verbose output', { default: false })
        .action(async (file: string, options: SyncViewsCliOptions) => {
            await runSyncViews(file, options)
        })
}
