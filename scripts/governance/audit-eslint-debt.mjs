import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'
import { ESLINT_DEBT_RULE_SLICES } from './eslint-debt-targets.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(__dirname, '..', '..')
export const DEFAULT_BASELINE_PATH = '.github/governance/eslint-debt-baseline.json'
export const DEFAULT_OUTPUT_PATH = 'artifacts/governance/eslint-debt-latest.json'
export const DEFAULT_SCAN_ROOTS = [
    'app.vue',
    'components',
    'composables',
    'error.vue',
    'layouts',
    'lib',
    'middleware',
    'pages',
    'plugins',
    'server',
    'types',
    'utils',
]

const SOURCE_FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.vue'])

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            baseline: DEFAULT_BASELINE_PATH,
            output: DEFAULT_OUTPUT_PATH,
        },
        values: {
            '--baseline': { key: 'baseline' },
            '--output': { key: 'output' },
        },
    })
}

async function pathExists(targetPath) {
    try {
        await access(targetPath)
        return true
    } catch {
        return false
    }
}

function toPosixPath(targetPath, projectRoot = repoRoot) {
    const relativePath = path.relative(projectRoot, targetPath).replaceAll('\\', '/')

    return relativePath || '.'
}

async function collectSourceFiles(targetPath) {
    if (!(await pathExists(targetPath))) {
        return []
    }

    try {
        const entries = await readdir(targetPath, { withFileTypes: true })
        const files = []

        for (const entry of entries) {
            const absolutePath = path.join(targetPath, entry.name)

            if (entry.isDirectory()) {
                files.push(...await collectSourceFiles(absolutePath))
                continue
            }

            if (entry.isFile() && SOURCE_FILE_EXTENSIONS.has(path.extname(entry.name))) {
                files.push(absolutePath)
            }
        }

        return files.sort()
    } catch {
        if (!SOURCE_FILE_EXTENSIONS.has(path.extname(targetPath))) {
            return []
        }

        return [targetPath]
    }
}

function unique(values) {
    return [...new Set(values)].sort()
}

function uniqueBy(values, keyFn) {
    const seen = new Set()
    const result = []

    for (const value of values) {
        const key = keyFn(value)

        if (seen.has(key)) {
            continue
        }

        seen.add(key)
        result.push(value)
    }

    return result
}

function computeLineNumber(content, index) {
    return content.slice(0, index).split('\n').length
}

export function collectExplicitExemptionsFromContent(content, ruleId) {
    const matches = content.matchAll(/eslint-disable(?:-next-line|-line)?\s+([^\r\n*]+)/gu)

    return [...matches]
        .flatMap((match) => {
            const ruleList = String(match[1] ?? '')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)

            if (!ruleList.includes(ruleId)) {
                return []
            }

            return [{
                line: computeLineNumber(content, match.index ?? 0),
                text: match[0].trim(),
            }]
        })
}

export function normalizeRuleMessages(results, ruleId, projectRoot = repoRoot) {
    return results.flatMap((result) => result.messages
        .filter((message) => message.ruleId === ruleId)
        .map((message) => ({
            column: Number(message.column || 0),
            filePath: toPosixPath(result.filePath, projectRoot),
            line: Number(message.line || 0),
            message: message.message,
            severity: message.severity === 2 ? 'error' : 'warning',
        })))
}

function buildDirectoryBuckets(items) {
    const buckets = new Map()

    for (const item of items) {
        const directory = path.posix.dirname(item.filePath)
        buckets.set(directory, (buckets.get(directory) ?? 0) + 1)
    }

    return [...buckets.entries()]
        .map(([directory, count]) => ({ count, directory }))
        .sort((left, right) => right.count - left.count || left.directory.localeCompare(right.directory))
}

export function evaluateBaselineDelta(report, baseline) {
    if (!baseline || !Array.isArray(baseline.slices)) {
        return {
            hasBaseline: false,
            slices: [],
        }
    }

    const baselineByScope = new Map(baseline.slices.map((slice) => [slice.scope, slice]))

    return {
        hasBaseline: true,
        slices: report.slices.map((slice) => {
            const previous = baselineByScope.get(slice.scope)

            return {
                explicitExemptionCountDelta: slice.explicitExemptionCount - Number(previous?.explicitExemptionCount ?? 0),
                previousExplicitExemptionCount: Number(previous?.explicitExemptionCount ?? 0),
                previousWarningCount: Number(previous?.warningCount ?? 0),
                scope: slice.scope,
                warningCountDelta: slice.warningCount - Number(previous?.warningCount ?? 0),
            }
        }),
    }
}

async function loadJsonIfExists(filePath) {
    try {
        return JSON.parse(await readFile(filePath, 'utf8'))
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
            return null
        }

        throw error
    }
}

async function collectExplicitExemptions(ruleId, projectRoot = repoRoot) {
    const roots = DEFAULT_SCAN_ROOTS.map((rootPath) => path.join(projectRoot, rootPath))
    const sourceFiles = unique((await Promise.all(roots.map((rootPath) => collectSourceFiles(rootPath)))).flat())
    const exemptions = []

    for (const filePath of sourceFiles) {
        const content = await readFile(filePath, 'utf8')
        const currentExemptions = collectExplicitExemptionsFromContent(content, ruleId)
            .map((exemption) => ({
                ...exemption,
                filePath: toPosixPath(filePath, projectRoot),
            }))

        exemptions.push(...currentExemptions)
    }

    return uniqueBy(exemptions, (item) => `${item.filePath}:${item.line}:${item.text}`)
}

async function collectRuleSliceReport(eslint, slice, projectRoot = repoRoot) {
    const lintResults = await eslint.lintFiles(slice.files)
    const residualWarnings = normalizeRuleMessages(lintResults, slice.ruleId, projectRoot)
    const explicitExemptions = await collectExplicitExemptions(slice.ruleId, projectRoot)

    return {
        configuredFiles: [...slice.files],
        configuredIgnores: [...slice.ignores],
        directoryBuckets: buildDirectoryBuckets(residualWarnings),
        explicitExemptionCount: explicitExemptions.length,
        explicitExemptions,
        filesWithWarnings: unique(residualWarnings.map((item) => item.filePath)).length,
        rationale: slice.rationale,
        residualWarnings,
        ruleId: slice.ruleId,
        scope: slice.scope,
        warningCount: residualWarnings.length,
    }
}

export async function collectEslintDebtReport(options = {}) {
    const projectRoot = options.projectRoot ?? repoRoot
    const baselinePath = path.isAbsolute(options.baseline ?? DEFAULT_BASELINE_PATH)
        ? (options.baseline ?? DEFAULT_BASELINE_PATH)
        : path.join(projectRoot, options.baseline ?? DEFAULT_BASELINE_PATH)
    const eslint = new ESLint({
        cwd: projectRoot,
        errorOnUnmatchedPattern: false,
        fix: false,
    })
    const slices = []

    for (const slice of ESLINT_DEBT_RULE_SLICES) {
        slices.push(await collectRuleSliceReport(eslint, slice, projectRoot))
    }

    const report = {
        generatedAt: new Date().toISOString(),
        slices,
        summary: {
            explicitExemptionCount: slices.reduce((total, slice) => total + slice.explicitExemptionCount, 0),
            filesWithWarnings: unique(slices.flatMap((slice) => slice.residualWarnings.map((item) => item.filePath))).length,
            ruleCount: slices.length,
            warningCount: slices.reduce((total, slice) => total + slice.warningCount, 0),
        },
    }
    const baseline = await loadJsonIfExists(baselinePath)

    return {
        ...report,
        baseline: {
            delta: evaluateBaselineDelta(report, baseline),
            exists: Boolean(baseline),
            path: toPosixPath(baselinePath, projectRoot),
        },
    }
}

export function renderMarkdownReport(report, artifactPath = null) {
    const lines = [
        '# Governance Baseline — eslint-debt',
        '',
        `- 生成时间: ${report.generatedAt}`,
        artifactPath ? `- 产物路径: ${artifactPath}` : null,
        `- 基线路径: ${report.baseline.path}`,
        '',
        '## Summary',
        '',
        `- 规则切片数: ${report.summary.ruleCount}`,
        `- warning 总数: ${report.summary.warningCount}`,
        `- 显式豁免总数: ${report.summary.explicitExemptionCount}`,
        `- 命中文件数: ${report.summary.filesWithWarnings}`,
        `- 基线状态: ${report.baseline.exists ? '已检测到 baseline' : '尚未建立 baseline'}`,
        '',
    ].filter(Boolean)

    for (const slice of report.slices) {
        const baselineDelta = report.baseline.delta.slices.find((item) => item.scope === slice.scope)

        lines.push(`## ${slice.scope}`)
        lines.push('')
        lines.push(`- rule: ${slice.ruleId}`)
        lines.push(`- warning 数: ${slice.warningCount}`)
        lines.push(`- 显式豁免数: ${slice.explicitExemptionCount}`)
        lines.push(`- 命中文件数: ${slice.filesWithWarnings}`)
        lines.push(`- 范围文件声明数: ${slice.configuredFiles.length}`)
        lines.push(`- 范围忽略声明数: ${slice.configuredIgnores.length}`)
        lines.push(`- 说明: ${slice.rationale}`)

        if (baselineDelta) {
            lines.push(`- warning delta: ${baselineDelta.warningCountDelta >= 0 ? '+' : ''}${baselineDelta.warningCountDelta}`)
            lines.push(`- exemption delta: ${baselineDelta.explicitExemptionCountDelta >= 0 ? '+' : ''}${baselineDelta.explicitExemptionCountDelta}`)
        }

        lines.push('')
        lines.push('### Top Directories')
        if (slice.directoryBuckets.length === 0) {
            lines.push('- 无')
        } else {
            for (const bucket of slice.directoryBuckets.slice(0, 10)) {
                lines.push(`- ${bucket.directory}: ${bucket.count}`)
            }
        }

        lines.push('')
        lines.push('### Residual Warnings')
        if (slice.residualWarnings.length === 0) {
            lines.push('- 无')
        } else {
            for (const warning of slice.residualWarnings.slice(0, 20)) {
                lines.push(`- ${warning.filePath}:${warning.line}:${warning.column} ${warning.message}`)
            }
        }

        lines.push('')
        lines.push('### Explicit Exemptions')
        if (slice.explicitExemptions.length === 0) {
            lines.push('- 无')
        } else {
            for (const exemption of slice.explicitExemptions.slice(0, 20)) {
                lines.push(`- ${exemption.filePath}:${exemption.line} ${exemption.text}`)
            }
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

    return {
        jsonPath: resolvedOutputPath,
        markdownPath,
    }
}

export async function main(argv = process.argv) {
    const { baseline, output } = parseArgs(argv)
    const report = await collectEslintDebtReport({ baseline })
    const artifacts = await writeArtifacts(report, output)

    console.info('ESLint debt audit completed.')
    console.info(`- warning 总数: ${report.summary.warningCount}`)
    console.info(`- 显式豁免总数: ${report.summary.explicitExemptionCount}`)
    console.info(`- JSON: ${toPosixPath(artifacts.jsonPath)}`)
    console.info(`- Markdown: ${toPosixPath(artifacts.markdownPath)}`)

    return report
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
