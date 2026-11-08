/**
 * PrimeVue `--p-*` token 映射表守卫（映射表见 docs/design/governance/2026-11-08-primevue-token-mapping.md）。
 *
 * 用途：把「120 个唯一 `--p-*` → 三分类 + 目标 token」的事实源收敛到
 * `scripts/governance/data/primevue-token-map.json`，并提供两件事：
 * 1. **覆盖率校验**：仓库中出现的每个 `--p-*` 都必须已在映射表中登记；
 * 2. **禁止新增**：未登记的 `--p-*`（含新写法）直接失败——迁移期间这是「不得再扩大
 *    PrimeVue token 面」的硬约束，卸载后配合 `--fail-on-residual` 变成「零残留」守卫。
 *
 * 口径与 `count-primevue-usage.mjs` 完全一致（复用其 `collectFiles` 与扫描面），避免
 * 「映射表按一套文件集统计、基线按另一套」的漂移。
 *
 * 用法：
 *   node scripts/governance/check-primevue-token-map.mjs                 # 校验覆盖率
 *   node scripts/governance/check-primevue-token-map.mjs --fail-on-residual
 *   node scripts/governance/check-primevue-token-map.mjs --markdown      # 输出文档表格
 *   node scripts/governance/check-primevue-token-map.mjs --doc=docs/design/governance/xxx.md
 *   node scripts/governance/check-primevue-token-map.mjs --root=<dir> --map=<path>   # 测试用
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'
import { collectFiles, projectRoot } from './count-primevue-usage.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const defaultMapPath = path.join(__dirname, 'data', 'primevue-token-map.json')

const TOKEN_PATTERN = /--p-[a-z0-9-]+/gu
const TOKEN_NAME_PATTERN = /^--p-[a-z0-9-]+$/u
const TOKEN_CLASSES = ['semantic', 'palette', 'phantom']
const CLASS_LABELS = {
    semantic: 'v4 语义角色',
    palette: 'v4 调色板',
    phantom: 'v3 幻影 / 未产出引用',
}
const DISPOSITIONS = new Set(['map', 'delete'])
const TARGET_PATTERN = /^--(?:caomei|m)-[a-z0-9*-]+$/u
export const DOC_TABLE_START = '<!-- primevue-token-map:start -->'
export const DOC_TABLE_END = '<!-- primevue-token-map:end -->'

/** 读取映射表。 */
export async function loadTokenMap(mapPath = defaultMapPath) {
    return JSON.parse(await readFile(mapPath, 'utf8'))
}

/**
 * 扫描仓库中的 `--p-*` token（与 `governance:count:primevue-usage` 同一扫描面）。
 *
 * @returns {Promise<Map<string, { count: number, files: Set<string> }>>}
 */
export async function collectTokens(root = projectRoot) {
    const files = await collectFiles(root)
    const tokens = new Map()

    for (const relativePath of files) {
        const content = await readFile(path.join(root, relativePath), 'utf8')
        for (const match of content.matchAll(TOKEN_PATTERN)) {
            const token = match[0]
            if (!tokens.has(token)) {
                tokens.set(token, { count: 0, files: new Set() })
            }
            const entry = tokens.get(token)
            entry.count += 1
            entry.files.add(relativePath)
        }
    }

    return tokens
}

/**
 * 校验映射表自身结构。
 *
 * @returns {string[]} 错误清单（空数组即通过）
 */
export function validateTokenMap(map) {
    const errors = []
    const entries = map?.entries

    if (!entries || typeof entries !== 'object') {
        return ['映射表缺少 entries 对象']
    }

    for (const [token, entry] of Object.entries(entries)) {
        if (!TOKEN_NAME_PATTERN.test(token)) {
            errors.push(`${token}: 不是合法的 --p-* token`)
        }

        if (!TOKEN_CLASSES.includes(entry.class)) {
            errors.push(`${token}: class 必须是 ${TOKEN_CLASSES.join(' / ')}`)
        }
        if (!DISPOSITIONS.has(entry.disposition)) {
            errors.push(`${token}: disposition 必须是 map / delete`)
        }
        if (entry.disposition === 'map' && !TARGET_PATTERN.test(String(entry.target ?? ''))) {
            errors.push(`${token}: 映射目标必须是 --caomei-* / --m-*（实际: ${entry.target}）`)
        }
        if (entry.disposition === 'delete' && entry.target !== null) {
            errors.push(`${token}: disposition=delete 时 target 必须为 null`)
        }
        if (typeof entry.note !== 'string' || entry.note.trim() === '') {
            errors.push(`${token}: 缺少说明 note`)
        }
    }

    return errors
}

/**
 * 计算覆盖率。
 *
 * @returns {{ unknown: string[], mapped: string[], stale: string[] }}
 *   unknown: 仓库出现但未登记（禁止新增命中）
 *   mapped:  已登记的当前 token
 *   stale:   已登记但仓库已不再出现（迁移推进后的正常现象，只作提示）
 */
export function evaluateCoverage(tokens, map) {
    const entries = map?.entries ?? {}
    const unknown = []
    const mapped = []
    const stale = []

    for (const token of tokens.keys()) {
        if (Object.hasOwn(entries, token)) {
            mapped.push(token)
        } else {
            unknown.push(token)
        }
    }

    for (const token of Object.keys(entries)) {
        if (!tokens.has(token)) {
            stale.push(token)
        }
    }

    return {
        unknown: unknown.sort(),
        mapped: mapped.sort(),
        stale: stale.sort(),
    }
}

/** 生成文档表格（按分类 + token 名排序，保证可机械复算）。 */
export function buildMarkdownTable(map) {
    const entries = map?.entries ?? {}
    const rows = Object.entries(entries).sort(([leftToken, left], [rightToken, right]) => {
        const classDiff = TOKEN_CLASSES.indexOf(left.class) - TOKEN_CLASSES.indexOf(right.class)
        return classDiff === 0 ? leftToken.localeCompare(rightToken) : classDiff
    })

    const lines = [
        '| token | 分类 | 处置 | 目标 | 说明 |',
        '| :--- | :--- | :--- | :--- | :--- |',
    ]

    for (const [token, entry] of rows) {
        const target = entry.disposition === 'delete' ? '（删除）' : `\`${entry.target}\``
        lines.push(`| \`${token}\` | ${entry.class} | ${entry.disposition} | ${target} | ${entry.note} |`)
    }

    return lines.join('\n')
}

/** 从文档中提取映射表（marker 之间）。 */
export function extractDocTable(markdown) {
    const startIndex = markdown.indexOf(DOC_TABLE_START)
    const endIndex = markdown.indexOf(DOC_TABLE_END)

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        return null
    }

    return markdown.slice(startIndex + DOC_TABLE_START.length, endIndex).trim()
}

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            doc: null,
            failOnResidual: false,
            map: defaultMapPath,
            markdown: false,
            output: null,
            root: projectRoot,
        },
        flags: {
            '--fail-on-residual': { key: 'failOnResidual', value: true },
            '--markdown': { key: 'markdown', value: true },
        },
        values: {
            '--doc': { key: 'doc' },
            '--map': { key: 'map' },
            '--output': { key: 'output' },
            '--root': { key: 'root' },
        },
    })
}

/**
 * 主流程（导出以便单测直接调用）。
 *
 * @returns {Promise<{ ok: boolean, errors: string[], warnings: string[], markdown: string | null }>}
 */
export async function run(options = {}) {
    const settings = { ...parseArgs([]), ...options }
    const map = await loadTokenMap(settings.map)
    const errors = validateTokenMap(map)
    const warnings = []
    let markdown = null

    if (errors.length === 0) {
        const tokens = await collectTokens(settings.root)
        const coverage = evaluateCoverage(tokens, map)

        for (const token of coverage.unknown) {
            errors.push(`未登记的新增 --p-* token：${token}（迁移期禁止扩大 PrimeVue token 面）`)
        }
        if (settings.failOnResidual && tokens.size > 0) {
            errors.push(`仍有 ${tokens.size} 个 --p-* token 未清零（--fail-on-residual）`)
        }
        if (coverage.stale.length > 0) {
            warnings.push(`${coverage.stale.length} 个已登记 token 已从仓库消失（迁移推进的正常现象）`)
        }

        markdown = buildMarkdownTable(map)

        if (settings.doc) {
            const docContent = await readFile(path.resolve(settings.root, settings.doc), 'utf8')
            const docTable = extractDocTable(docContent)
            if (docTable === null) {
                errors.push(`文档缺少映射表 marker：${settings.doc}`)
            } else if (docTable !== markdown) {
                errors.push(`文档映射表与事实源不一致：${settings.doc}（重新运行 --markdown 覆盖 marker 区间）`)
            }
        }

        if (settings.output) {
            await writeFile(path.resolve(settings.root, settings.output), `${markdown}\n`, 'utf8')
        }
    }

    return { errors, markdown, ok: errors.length === 0, warnings }
}

async function main() {
    const options = parseArgs()
    const result = await run(options)

    if (options.markdown) {
        process.stdout.write(`${result.markdown}\n`)
    }

    for (const warning of result.warnings) {
        console.warn(`[primevue-token-map] WARN ${warning}`)
    }
    for (const error of result.errors) {
        console.error(`[primevue-token-map] ${error}`)
    }

    if (!result.ok) {
        process.exitCode = 1
        return
    }

    if (!options.markdown) {
        console.log('[primevue-token-map] PASS')
    }
}

if (isDirectExecution(import.meta.url)) {
    main()
}
