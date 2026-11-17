import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

/**
 * 专项治理目录索引检查。
 *
 * 断言口径：`docs/design/governance` 目录内每份 `*.md` 要么被 `index.md` 的兄弟链接收录，
 * 要么登记在 allowlist（一次性 / 临时报告）并写明理由。`index.md` 自身与 `archive/**` 不参与断言
 * ——前者是被检查的索引，后者已有独立归档入口。
 *
 * 只做「是否登记」判定，不校验链接可达性（由 `docs:check:links` 负责），避免两套门禁互相掩盖。
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(__dirname, '..', '..')
export const DEFAULT_GOVERNANCE_DIR = 'docs/design/governance'
export const DEFAULT_INDEX_PATH = 'docs/design/governance/index.md'
export const DEFAULT_ALLOWLIST_PATH = 'scripts/governance/data/governance-index-allowlist.json'
export const DEFAULT_OUTPUT_PATH = 'artifacts/governance/governance-index-latest.json'

/** 目录内不参与断言的条目。 */
export const EXCLUDED_ENTRIES = new Set(['index.md'])

/**
 * Markdown 行内链接：`](target)` / `](<target>)` / `](target "title")` / `](target 'title')`。
 * 只取目标部分，标题与尖括号在后续归一化中剔除；图片语法 `![alt](src)` 先剔除 `!` 再按普通链接匹配，
 * 但图片指向的是资源而非治理文档，故在提取时按扩展名跳过。
 */
const MARKDOWN_LINK_PATTERN = /\]\(\s*<?([^)\s>]+)>?(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/gu

/** 资源文件扩展名：图片等资源不参与「文档是否被索引」判定。 */
const ASSET_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.ico', '.pdf'])

/** 绝对 URL / 协议链接（`https:` / `mailto:` 等）不参与索引判定。 */
const ABSOLUTE_URL_PATTERN = /^[a-z][a-z0-9+.-]*:/iu

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            allowlist: DEFAULT_ALLOWLIST_PATH,
            dir: DEFAULT_GOVERNANCE_DIR,
            index: DEFAULT_INDEX_PATH,
            mode: 'report',
            output: DEFAULT_OUTPUT_PATH,
        },
        values: {
            '--allowlist': { key: 'allowlist' },
            '--dir': { key: 'dir' },
            '--index': { key: 'index' },
            '--mode': {
                key: 'mode',
                allowedValues: ['report', 'error'],
                invalidMessage: (value) => `[governance-index] 不支持的模式: ${value}，请使用 report 或 error`,
            },
            '--output': { key: 'output' },
        },
    })
}

export function toPosixPath(targetPath, projectRoot = repoRoot) {
    return path.relative(projectRoot, targetPath).replaceAll('\\', '/') || '.'
}

async function pathExists(targetPath) {
    try {
        await access(targetPath)
        return true
    } catch {
        return false
    }
}

/**
 * 从索引正文提取「同目录文档」目标（只取文件名，不含子目录与外部链接）。
 *
 * 索引里的兄弟文档链接存在两种写法：`./foo` 与 `./foo.md`；两种都归一为 `foo.md`。
 * 带 `/` 的目标（`./archive/index.md`、`../modules/index.md`）不属于本目录断言面，直接忽略。
 */
export function extractIndexedTargets(indexContent) {
    const targets = new Set()

    for (const match of String(indexContent ?? '').matchAll(MARKDOWN_LINK_PATTERN)) {
        const rawTarget = (match[1] ?? '').trim()

        if (!rawTarget || rawTarget.startsWith('#') || ABSOLUTE_URL_PATTERN.test(rawTarget)) {
            continue
        }

        const withoutFragment = rawTarget.split('#')[0]?.split('?')[0]?.replace(/^\.\//u, '') ?? ''

        if (!withoutFragment || withoutFragment.includes('/')) {
            continue
        }

        if (ASSET_EXTENSIONS.has(path.posix.extname(withoutFragment).toLowerCase())) {
            continue
        }

        targets.add(withoutFragment.endsWith('.md') ? withoutFragment : `${withoutFragment}.md`)
    }

    return targets
}

/**
 * @typedef {object} GovernanceIndexAllowlistEntry
 * @property {string} path 仓库相对路径
 * @property {string} reason 登记理由
 */

/**
 * allowlist 归一：`path` 允许写仓库相对路径或目录内文件名，内部统一取文件名比对。
 */
export function normalizeAllowlist(rawAllowlist) {
    let rawEntries = []

    if (Array.isArray(rawAllowlist?.entries)) {
        rawEntries = rawAllowlist.entries
    } else if (Array.isArray(rawAllowlist)) {
        rawEntries = rawAllowlist
    }

    return rawEntries
        .map((entry, index) => {
            const rawPath = String(entry?.path ?? '').trim().replaceAll('\\', '/')
            const reason = String(entry?.reason ?? '').trim()

            if (!rawPath) {
                throw new Error(`Invalid governance index allowlist entry at index ${index}: missing path`)
            }

            if (!reason) {
                throw new Error(`Invalid governance index allowlist entry at index ${index} (${rawPath}): missing reason`)
            }

            return {
                fileName: path.posix.basename(rawPath),
                path: rawPath,
                reason,
            }
        })
        .sort((left, right) => left.fileName.localeCompare(right.fileName))
}

/**
 * 三类判定：已索引 / 未索引但登记在 allowlist / 未登记（需要补索引或补登记）。
 * 附带两类过期信号：allowlist 指向的文件已不存在、索引链接指向本目录不存在的文件。
 */
export function evaluateGovernanceIndex({ allowlist = [], files, indexedTargets }) {
    const fileSet = new Set(files)
    const indexed = []
    const allowlisted = []
    const unregistered = []

    for (const file of [...files].sort()) {
        if (indexedTargets.has(file)) {
            indexed.push(file)
            continue
        }

        const allowlistEntry = allowlist.find((entry) => entry.fileName === file)

        if (allowlistEntry) {
            allowlisted.push({ path: file, reason: allowlistEntry.reason })
            continue
        }

        unregistered.push(file)
    }

    const staleAllowlist = allowlist
        .filter((entry) => !fileSet.has(entry.fileName))
        .map((entry) => entry.path)
        .sort()
    const staleIndexLinks = [...indexedTargets]
        .filter((target) => !fileSet.has(target))
        .sort()
    // 既被索引又留在 allowlist 的条目：索引补齐后应清掉台账，否则台账失真。
    // 按 allowlist 侧统计（该文件已归入 indexed，不会再进 allowlisted）。
    const redundantAllowlist = allowlist
        .filter((entry) => fileSet.has(entry.fileName) && indexedTargets.has(entry.fileName))
        .map((entry) => entry.fileName)
        .sort()

    return {
        allowlisted,
        indexed,
        redundantAllowlist,
        staleAllowlist,
        staleIndexLinks,
        unregistered,
    }
}

/**
 * @typedef {object} GovernanceIndexReport
 * @property {string} generatedAt
 * @property {string} directory
 * @property {string} indexPath
 * @property {string|null} allowlistPath
 * @property {number} documentCount
 * @property {number} indexedCount
 * @property {number} allowlistedCount
 * @property {number} unregisteredCount
 * @property {string[]} indexed
 * @property {{path: string, reason: string}[]} allowlisted
 * @property {string[]} unregistered
 * @property {string[]} redundantAllowlist
 * @property {string[]} staleAllowlist
 * @property {string[]} staleIndexLinks
 */

export function buildGovernanceIndexReport({ allowlist, allowlistPath = null, directory, files, generatedAt, indexContent, indexPath }) {
    const indexedTargets = extractIndexedTargets(indexContent)
    const evaluation = evaluateGovernanceIndex({ allowlist, files, indexedTargets })

    return {
        allowlistPath,
        allowlisted: evaluation.allowlisted,
        allowlistedCount: evaluation.allowlisted.length,
        directory,
        documentCount: files.length,
        generatedAt,
        indexed: evaluation.indexed,
        indexedCount: evaluation.indexed.length,
        indexPath,
        redundantAllowlist: evaluation.redundantAllowlist,
        staleAllowlist: evaluation.staleAllowlist,
        staleIndexLinks: evaluation.staleIndexLinks,
        unregistered: evaluation.unregistered,
        unregisteredCount: evaluation.unregistered.length,
    }
}

export async function collectGovernanceIndexFiles(governanceDir, projectRoot = repoRoot) {
    const absoluteDir = path.isAbsolute(governanceDir) ? governanceDir : path.join(projectRoot, governanceDir)

    if (!(await pathExists(absoluteDir))) {
        throw new Error(`Governance directory not found: ${governanceDir}`)
    }

    const entries = await readdir(absoluteDir, { withFileTypes: true })

    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && !EXCLUDED_ENTRIES.has(entry.name))
        .map((entry) => entry.name)
        .sort()
}

async function loadAllowlist(allowlistPath, projectRoot = repoRoot) {
    const absolutePath = path.isAbsolute(allowlistPath) ? allowlistPath : path.join(projectRoot, allowlistPath)

    if (!(await pathExists(absolutePath))) {
        // 默认路径缺失视为「本目录暂无台账」；显式传入的路径缺失是配置错误，必须响亮失败，
        // 否则全部台账条目会被误报成「未登记文档」。
        if (allowlistPath !== DEFAULT_ALLOWLIST_PATH) {
            throw new Error(`Governance index allowlist not found: ${allowlistPath}`)
        }

        return { entries: [], path: null }
    }

    const content = JSON.parse(await readFile(absolutePath, 'utf8'))

    return { entries: normalizeAllowlist(content), path: toPosixPath(absolutePath, projectRoot) }
}

/**
 * @param {{ allowlistPath?: string, governanceDir?: string, indexPath?: string, projectRoot?: string }} options
 * @returns {Promise<GovernanceIndexReport>}
 */
export async function collectGovernanceIndex(options = {}) {
    const projectRoot = options.projectRoot ?? repoRoot
    const governanceDir = options.governanceDir ?? DEFAULT_GOVERNANCE_DIR
    const indexPath = options.indexPath ?? path.posix.join(governanceDir, 'index.md')
    const absoluteIndexPath = path.isAbsolute(indexPath) ? indexPath : path.join(projectRoot, indexPath)

    // 先确认目录存在：整目录缺失时报「目录不存在」比报「索引不存在」更贴近真实原因。
    const files = await collectGovernanceIndexFiles(governanceDir, projectRoot)

    if (!(await pathExists(absoluteIndexPath))) {
        throw new Error(`Governance index not found: ${indexPath}`)
    }

    const [indexContent, allowlist] = await Promise.all([
        readFile(absoluteIndexPath, 'utf8'),
        loadAllowlist(options.allowlistPath ?? DEFAULT_ALLOWLIST_PATH, projectRoot),
    ])

    return buildGovernanceIndexReport({
        allowlist: allowlist.entries,
        allowlistPath: allowlist.path,
        directory: toPosixPath(path.isAbsolute(governanceDir) ? governanceDir : path.join(projectRoot, governanceDir), projectRoot),
        files,
        generatedAt: new Date().toISOString(),
        indexContent,
        indexPath: toPosixPath(absoluteIndexPath, projectRoot),
    })
}

/**
 * @param {GovernanceIndexReport} report
 * @param {string|null} artifactPath
 */
export function renderMarkdownReport(report, artifactPath = null) {
    const lines = [
        '# 治理目录索引检查',
        '',
        `- 生成时间: ${report.generatedAt}`,
        artifactPath ? `- 产物路径: ${artifactPath}` : null,
        `- 目录: ${report.directory}（${report.documentCount} 份文档，排除 index.md 与 archive/**）`,
        `- 已索引: ${report.indexedCount}`,
        `- allowlist 登记: ${report.allowlistedCount}`,
        `- 未登记: ${report.unregisteredCount}`,
        `- allowlist: ${report.allowlistPath ?? '（未提供）'}`,
        '',
        '## 未登记文档',
        '',
    ].filter((line) => line !== null)

    if (report.unregistered.length === 0) {
        lines.push('无。', '')
    } else {
        lines.push('| 文档 |', '|:---|')

        for (const file of report.unregistered) {
            lines.push(`| \`${file}\` |`)
        }

        lines.push('')
    }

    lines.push('## allowlist 登记', '')

    if (report.allowlisted.length === 0) {
        lines.push('无。', '')
    } else {
        lines.push('| 文档 | 理由 |', '|:---|:---|')

        for (const entry of report.allowlisted) {
            lines.push(`| \`${entry.path}\` | ${entry.reason} |`)
        }

        lines.push('')
    }

    if (report.redundantAllowlist.length > 0 || report.staleAllowlist.length > 0 || report.staleIndexLinks.length > 0) {
        lines.push('## 台账与索引的过期信号（仅报告，不判红）', '')

        for (const redundantPath of report.redundantAllowlist) {
            lines.push(`- 已补入索引但仍留在 allowlist：\`${redundantPath}\``)
        }

        for (const stalePath of report.staleAllowlist) {
            lines.push(`- allowlist 指向的文件已不存在：\`${stalePath}\``)
        }

        for (const staleLink of report.staleIndexLinks) {
            lines.push(`- 索引链接指向本目录不存在的文件：\`${staleLink}\``)
        }

        lines.push('')
    }

    return lines.join('\n').trimEnd()
}

function resolveMarkdownPath(outputPath) {
    return outputPath.endsWith('.json') ? outputPath.replace(/\.json$/u, '.md') : `${outputPath}.md`
}

async function writeArtifacts(report, outputPath, projectRoot = repoRoot) {
    const resolvedOutputPath = path.isAbsolute(outputPath) ? outputPath : path.join(projectRoot, outputPath)
    const markdownPath = resolveMarkdownPath(resolvedOutputPath)

    await mkdir(path.dirname(resolvedOutputPath), { recursive: true })
    await writeFile(resolvedOutputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    await writeFile(markdownPath, `${renderMarkdownReport(report, toPosixPath(markdownPath, projectRoot))}\n`, 'utf8')

    return { jsonPath: resolvedOutputPath, markdownPath }
}

export async function main(argv = process.argv) {
    const args = parseArgs(argv)
    const report = await collectGovernanceIndex({
        allowlistPath: args.allowlist,
        governanceDir: args.dir,
        indexPath: args.index,
    })
    const artifacts = await writeArtifacts(report, args.output)

    console.info('Governance index check completed.')
    console.info(`- 文档数: ${report.documentCount}`)
    console.info(`- 已索引: ${report.indexedCount}`)
    console.info(`- allowlist: ${report.allowlistedCount}`)
    console.info(`- 未登记: ${report.unregisteredCount}`)
    console.info(`- JSON: ${toPosixPath(artifacts.jsonPath)}`)
    console.info(`- Markdown: ${toPosixPath(artifacts.markdownPath)}`)

    for (const file of report.unregistered) {
        console.info(`  - ${file}`)
    }

    if (report.staleAllowlist.length > 0) {
        console.info(`- allowlist 过期条目: ${report.staleAllowlist.length}`)

        for (const stalePath of report.staleAllowlist) {
            console.info(`  - ${stalePath}（文件已不存在）`)
        }
    }

    if (report.staleIndexLinks.length > 0) {
        console.info(`- 索引链接指向不存在的文件: ${report.staleIndexLinks.length}`)

        for (const staleLink of report.staleIndexLinks) {
            console.info(`  - ${staleLink}`)
        }
    }

    if (report.redundantAllowlist.length > 0) {
        console.info(`- 已补索引但仍登记在 allowlist: ${report.redundantAllowlist.length}`)

        for (const redundantPath of report.redundantAllowlist) {
            console.info(`  - ${redundantPath}`)
        }
    }

    if (args.mode === 'error' && report.unregisteredCount > 0) {
        process.exitCode = 1
    }

    return report
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
