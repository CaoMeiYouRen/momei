import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

/**
 * parity 允许清单清零脚本。
 *
 * 场景：CI `visual-reference-refresh.yml` 全量重采参考态后，原先「参考态固化旧缺陷」而登记的
 * 允许清单不再成立，必须清零；靠人工改 JSON 容易漏条目或误删 note 里的历史校准记录。
 *
 * 口径：
 * - 只清 `allowlist`，不改 `tiers` / `maxDiffPixels` / `maxDiffPixelRatio`；
 * - `note` 只**追加**清零记录，不删除既有历史；
 * - 幂等：已为空的条目不计入变更；
 * - `--dry-run` 只输出将清零的条目。
 *
 * 流程（详见 docs/standards/testing.md §7.2）：
 * 1. CI `visual-reference-refresh.yml` 全量重采参考态；
 * 2. `pnpm prune:parity-allowlist --dry-run` 核对待清零条目；
 * 3. 去掉 `--dry-run` 落盘；
 * 4. 复跑 `pnpm test:visual:parity`：重采后的绿 = 参考态与当前态同源；仍是预算内吸收的绿 = 必须登记到视觉一致性偏差处置表。
 *
 * 用法：
 * - `pnpm prune:parity-allowlist --dry-run`
 * - `pnpm prune:parity-allowlist --test-name=user-settings-light,user-settings-dark`
 * - `pnpm prune:parity-allowlist`（全部非空条目）
 */

const repoRoot = process.cwd()
const defaultBudgetPath = path.join('tests', 'visual', 'parity-budget.json')

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            budget: defaultBudgetPath,
            date: '',
            dryRun: false,
            output: '',
            testNames: [],
        },
        flags: {
            '--dry-run': { key: 'dryRun' },
        },
        values: {
            '--budget': { key: 'budget' },
            '--date': { key: 'date' },
            '--output': { key: 'output' },
            '--test-name': {
                key: 'testNames',
                parse: (value) => value.split(',').map((item) => item.trim()).filter(Boolean),
                collect: (previous, next) => [...(previous ?? []), ...next],
            },
        },
    })
}

export function resolveDateKey(value = '') {
    if (value) {
        if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
            throw new Error(`--date 需要 YYYY-MM-DD，收到: ${value}`)
        }
        return value
    }

    return new Date().toISOString().slice(0, 10)
}

function describeAllowlist(allowlist) {
    return allowlist.map((item) => {
        const region = item.region ?? {}
        return `${region.x ?? '?'},${region.y ?? '?'} ${region.width ?? '?'}x${region.height ?? '?'} (${item.pixels ?? '?'}px)`
    }).join('；')
}

/**
 * 纯函数：按 testName 清零 allowlist。
 *
 * @returns {{ budget: object, changed: Array<{name: string, cleared: number, description: string}>, missing: string[] }}
 */
export function pruneParityAllowlist(budget, options = {}) {
    if (!budget || typeof budget !== 'object' || !budget.entries || typeof budget.entries !== 'object') {
        throw new Error('parity 预算缺少 entries 对象')
    }

    const testNames = options.testNames ?? []
    const date = resolveDateKey(options.date)
    const entries = budget.entries
    const targets = testNames.length > 0 ? testNames : Object.keys(entries)
    const missing = testNames.filter((name) => !entries[name])
    const changed = []
    const nextEntries = { ...entries }

    for (const name of targets) {
        const entry = entries[name]
        if (!entry) {
            continue
        }

        const allowlist = Array.isArray(entry.allowlist) ? entry.allowlist : []
        if (allowlist.length === 0) {
            continue
        }

        const description = describeAllowlist(allowlist)
        const clearedRecord = `【允许清单清零 ${date}】按 testName 清零 ${allowlist.length} 条登记：${description}。`
        nextEntries[name] = {
            ...entry,
            allowlist: [],
            note: entry.note ? `${entry.note} ${clearedRecord}` : clearedRecord,
        }
        changed.push({ name, cleared: allowlist.length, description })
    }

    return {
        budget: { ...budget, entries: nextEntries },
        changed,
        missing,
    }
}

export function renderSummary(result) {
    const lines = []
    if (result.changed.length === 0) {
        lines.push('没有需要清零的 allowlist 条目。')
    } else {
        lines.push(`将清零 ${result.changed.length} 个条目的 allowlist：`)
        for (const item of result.changed) {
            lines.push(`- ${item.name}: ${item.cleared} 条（${item.description}）`)
        }
    }
    if (result.missing.length > 0) {
        lines.push(`未找到的 testName：${result.missing.join(', ')}`)
    }
    return lines.join('\n')
}

export async function main(options = {}) {
    const args = options.args ?? parseArgs()
    const rootDir = options.rootDir ?? repoRoot
    const log = options.log ?? console
    const budgetPath = path.isAbsolute(args.budget) ? args.budget : path.join(rootDir, args.budget)
    const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8'))
    const result = pruneParityAllowlist(budget, { date: args.date, testNames: args.testNames })

    log.info(renderSummary(result))

    if (result.missing.length > 0) {
        throw new Error(`指定的 testName 不存在：${result.missing.join(', ')}`)
    }

    if (args.dryRun) {
        log.info(`[prune-parity-allowlist] dry-run：未写入 ${path.relative(rootDir, budgetPath)}`)
        return { ...result, written: false }
    }

    if (result.changed.length > 0) {
        let outputPath = budgetPath
        if (args.output) {
            outputPath = path.isAbsolute(args.output) ? args.output : path.join(rootDir, args.output)
        }
        fs.mkdirSync(path.dirname(outputPath), { recursive: true })
        fs.writeFileSync(outputPath, `${JSON.stringify(result.budget, null, 4)}\n`, 'utf8')
        log.info(`[prune-parity-allowlist] 已写入 ${path.relative(rootDir, outputPath)}`)
    }

    return { ...result, written: result.changed.length > 0 }
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
