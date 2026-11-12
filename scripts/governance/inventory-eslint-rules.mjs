import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import tseslint from 'typescript-eslint'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'
import { DISABLED_TS_RULES, ESLINT_DEBT_RULE_SLICES, PRODUCTION_TS_IGNORES } from './eslint-debt-targets.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(__dirname, '..', '..')
export const DEFAULT_BASELINE_PATH = '.github/governance/eslint-rules-inventory-baseline.json'
export const DEFAULT_OUTPUT_PATH = 'artifacts/governance/eslint-rules-inventory-latest.json'
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
    'scripts',
    'server',
    'tests',
    'types',
    'utils',
    'nuxt.config.ts',
]

/**
 * 读取基准配置值的作用域：tests 位于 `strictTsRuleOverrides` 的 `RUNTIME_TS_IGNORES` 排除域，
 * 该作用域下 `calculateConfigForFile` 的结果代表 `eslint.config.js` 的显式基准配置。
 */
export const CONFIGURED_SEVERITY_SCOPE = 'tests'

/**
 * 候选规则命中数扫描范围：仅生产 TS / Vue 入口。
 * `nuxt.config.ts` 由 `allowDefaultProject` 加载且无类型信息，typed 规则会直接报错，故排除；
 * tests / scripts 维持显式豁免边界，若纳入须单列条目。
 */
export const CANDIDATE_HIT_SCAN_ROOTS = [
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

const SEVERITY_BY_NAME = {
    error: 2,
    off: 0,
    warn: 1,
}

export function normalizeSeverity(ruleConfig) {
    if (Array.isArray(ruleConfig)) {
        return normalizeSeverity(ruleConfig[0])
    }

    if (typeof ruleConfig === 'string') {
        return SEVERITY_BY_NAME[ruleConfig] ?? 0
    }

    return typeof ruleConfig === 'number' ? ruleConfig : 0
}

function isIgnoredByPatterns(relativePath, patterns) {
    return patterns.some((pattern) => path.matchesGlob(relativePath, pattern))
}

async function resolveConfiguredSeverities(eslint, projectRoot) {
    const baseFiles = await collectSourceFiles(path.join(projectRoot, CONFIGURED_SEVERITY_SCOPE))
    const sampleFile = baseFiles.find((filePath) => filePath.endsWith('.test.ts')) ?? baseFiles[0]
    const configuredSeverityByRule = new Map(DISABLED_TS_RULES.map((rule) => [rule.ruleId, 0]))

    if (!sampleFile) {
        return configuredSeverityByRule
    }

    const config = await eslint.calculateConfigForFile(sampleFile)

    for (const rule of DISABLED_TS_RULES) {
        configuredSeverityByRule.set(rule.ruleId, normalizeSeverity(config?.rules?.[rule.ruleId]))
    }

    return configuredSeverityByRule
}

export function isCandidateRule(rule) {
    return rule.configuredSeverity === 0 && rule.effectiveSeverity === 0
}

/**
 * 产出「规则 × configuredSeverity × effectiveSeverity × 命中数」候选表。
 *
 * - configuredSeverity 取 `eslint.config.js` 的显式 `[0]` 配置（由 DISABLED_TS_RULES 覆盖）。
 * - effectiveSeverity 为扫描面内该规则的最高生效级别（全文件 `calculateConfigForFile` 求最大值）。
 * - 命中数为生产 TS 范围强制升 warn 后实测，用于评估升档成本。
 */
export async function collectCandidateRuleTable(projectRoot = repoRoot) {
    const scanFiles = unique((await Promise.all(CANDIDATE_HIT_SCAN_ROOTS
        .map((rootPath) => collectSourceFiles(path.join(projectRoot, rootPath))))).flat())
    const configEslint = new ESLint({
        cwd: projectRoot,
        errorOnUnmatchedPattern: false,
        fix: false,
    })
    const effectiveSeverityByRule = new Map(DISABLED_TS_RULES.map((rule) => [rule.ruleId, 0]))
    const configuredSeverityByRule = await resolveConfiguredSeverities(configEslint, projectRoot)

    for (const filePath of scanFiles) {
        const config = await configEslint.calculateConfigForFile(filePath)

        for (const rule of DISABLED_TS_RULES) {
            const severity = normalizeSeverity(config?.rules?.[rule.ruleId])

            if (severity > (effectiveSeverityByRule.get(rule.ruleId) ?? 0)) {
                effectiveSeverityByRule.set(rule.ruleId, severity)
            }
        }
    }

    const candidateRuleIds = new Set(DISABLED_TS_RULES.map((rule) => rule.ruleId))
    const hitEslint = new ESLint({
        cwd: projectRoot,
        errorOnUnmatchedPattern: false,
        fix: false,
        overrideConfig: [{
            files: ['**/*.{ts,tsx,mts,cts}'],
            ignores: [...PRODUCTION_TS_IGNORES],
            plugins: {
                '@typescript-eslint': tseslint.plugin,
            },
            rules: Object.fromEntries([...candidateRuleIds].map((ruleId) => [ruleId, 'warn'])),
        }],
    })
    const lintResults = await hitEslint.lintFiles(CANDIDATE_HIT_SCAN_ROOTS.map((rootPath) => path.join(projectRoot, rootPath)))
    const fatalResults = lintResults.filter((result) => result.fatalErrorCount > 0)

    if (fatalResults.length > 0) {
        throw new Error(`候选规则扫描出现 ${fatalResults.length} 个解析失败文件（首个: ${toPosixPath(fatalResults[0].filePath, projectRoot)}），拒绝输出可能少计的报告。`)
    }

    const hitsByRule = new Map([...candidateRuleIds].map((ruleId) => [ruleId, []]))

    for (const result of lintResults) {
        for (const message of result.messages) {
            if (!message.ruleId || !candidateRuleIds.has(message.ruleId)) {
                continue
            }

            hitsByRule.get(message.ruleId)?.push({
                column: Number(message.column || 0),
                filePath: toPosixPath(result.filePath, projectRoot),
                line: Number(message.line || 0),
                message: message.message,
            })
        }
    }

    return DISABLED_TS_RULES.map((rule) => {
        const hits = hitsByRule.get(rule.ruleId) ?? []
        const configuredSeverity = configuredSeverityByRule.get(rule.ruleId) ?? 0
        const effectiveSeverity = effectiveSeverityByRule.get(rule.ruleId) ?? 0
        const directoryBuckets = buildDirectoryBuckets(hits).map((bucket) => ({
            directory: bucket.directory,
            hitCount: bucket.count,
        }))

        return {
            ruleId: rule.ruleId,
            scope: rule.scope,
            configuredSeverity,
            effectiveSeverity,
            isCandidate: isCandidateRule({ configuredSeverity, effectiveSeverity }),
            hitCount: hits.length,
            filesWithHits: unique(hits.map((hit) => hit.filePath)).length,
            topDirectory: directoryBuckets[0]?.directory ?? null,
            directoryBuckets,
        }
    })
}

export function evaluateBaselineDelta(report, baseline) {
    if (!baseline || !Array.isArray(baseline.rules)) {
        return {
            hasBaseline: false,
            rules: [],
        }
    }

    const baselineByRule = new Map(baseline.rules.map((rule) => [rule.ruleId, rule]))

    return {
        hasBaseline: true,
        rules: report.rules.map((rule) => {
            const previous = baselineByRule.get(rule.ruleId)

            return {
                previousWarningCount: Number(previous?.warningCount ?? 0),
                ruleId: rule.ruleId,
                warningCountDelta: rule.warningCount - Number(previous?.warningCount ?? 0),
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

async function collectRuleInventory(eslint, slice, projectRoot = repoRoot, candidateByRule = new Map()) {
    const lintResults = (await eslint.lintFiles(slice.files))
        .filter((result) => !isIgnoredByPatterns(toPosixPath(result.filePath, projectRoot), slice.ignores ?? []))
    const residualWarnings = normalizeRuleMessages(lintResults, slice.ruleId, projectRoot)
    const explicitExemptions = (await collectExplicitExemptions(slice.ruleId, projectRoot))
        .filter((exemption) => !isIgnoredByPatterns(exemption.filePath, slice.ignores ?? []))
    const directoryBuckets = buildDirectoryBuckets(residualWarnings)
    const candidate = candidateByRule.get(slice.ruleId)

    return {
        ruleId: slice.ruleId,
        scope: slice.scope,
        configuredSeverity: candidate?.configuredSeverity ?? 0,
        effectiveSeverity: candidate?.effectiveSeverity ?? 0,
        warningCount: residualWarnings.length,
        explicitExemptionCount: explicitExemptions.length,
        filesWithWarnings: unique(residualWarnings.map((item) => item.filePath)).length,
        directoryBuckets: directoryBuckets.map((bucket) => ({
            directory: bucket.directory,
            hitCount: bucket.count,
            clearedCount: explicitExemptions.filter((exemption) => path.posix.dirname(exemption.filePath) === bucket.directory).length,
            warningBaseline: bucket.count,
        })),
        residualWarnings,
        explicitExemptions,
    }
}

export async function collectEslintRulesInventory(options = {}) {
    const projectRoot = options.projectRoot ?? repoRoot
    const baselinePath = path.isAbsolute(options.baseline ?? DEFAULT_BASELINE_PATH)
        ? (options.baseline ?? DEFAULT_BASELINE_PATH)
        : path.join(projectRoot, options.baseline ?? DEFAULT_BASELINE_PATH)
    const eslint = new ESLint({
        cwd: projectRoot,
        errorOnUnmatchedPattern: false,
        fix: false,
    })
    const candidateRules = await collectCandidateRuleTable(projectRoot)
    const candidateByRule = new Map(candidateRules.map((rule) => [rule.ruleId, rule]))
    const rules = []

    for (const slice of ESLINT_DEBT_RULE_SLICES) {
        rules.push(await collectRuleInventory(eslint, slice, projectRoot, candidateByRule))
    }

    const report = {
        generatedAt: new Date().toISOString(),
        rules,
        candidateRules,
        summary: {
            ruleCount: rules.length,
            candidateRuleCount: candidateRules.filter((rule) => rule.isCandidate).length,
            warningCount: rules.reduce((total, rule) => total + rule.warningCount, 0),
            explicitExemptionCount: rules.reduce((total, rule) => total + rule.explicitExemptionCount, 0),
            filesWithWarnings: unique(rules.flatMap((rule) => rule.residualWarnings.map((item) => item.filePath))).length,
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
        '# ESLint Rules Inventory',
        '',
        `- 生成时间: ${report.generatedAt}`,
        artifactPath ? `- 产物路径: ${artifactPath}` : null,
        `- 基线路径: ${report.baseline.path}`,
        '',
        '## Summary',
        '',
        `- 规则数: ${report.summary.ruleCount}`,
        `- warning 总数: ${report.summary.warningCount}`,
        `- 显式豁免总数: ${report.summary.explicitExemptionCount}`,
        `- 命中文件数: ${report.summary.filesWithWarnings}`,
        `- 基线状态: ${report.baseline.exists ? '已检测到 baseline' : '尚未建立 baseline'}`,
        '',
    ].filter(Boolean)

    lines.push('## Disabled Rule Inventory (configured [0])')
    lines.push('')
    lines.push(`- 候选判定: configuredSeverity === 0 且 effectiveSeverity === 0（未被 strictTsRuleOverrides 覆盖）`)
    lines.push(`- 命中数口径: 生产 TS 强制升 warn 实测，不含 .vue 脚本块（typed 规则在 .vue 无类型信息）`)
    lines.push('')
    lines.push('| rule | candidate | configured | effective | hitCount | filesWithHits | topDirectory |')
    lines.push('|:---|:---|:---|:---|:---|:---|:---|')

    for (const rule of report.candidateRules ?? []) {
        lines.push(`| ${rule.ruleId} | ${rule.isCandidate ? 'yes' : 'no'} | ${rule.configuredSeverity} | ${rule.effectiveSeverity} | ${rule.hitCount} | ${rule.filesWithHits} | ${rule.topDirectory ?? '-'} |`)
    }

    lines.push('')

    for (const rule of report.rules) {
        const baselineDelta = report.baseline.delta.rules.find((item) => item.ruleId === rule.ruleId)

        lines.push(`## ${rule.scope}`)
        lines.push('')
        lines.push(`- rule: ${rule.ruleId}`)
        lines.push(`- configuredSeverity: ${rule.configuredSeverity}`)
        lines.push(`- effectiveSeverity: ${rule.effectiveSeverity}`)
        lines.push(`- warning 数: ${rule.warningCount}`)
        lines.push(`- 显式豁免数: ${rule.explicitExemptionCount}`)
        lines.push(`- 命中文件数: ${rule.filesWithWarnings}`)

        if (baselineDelta) {
            lines.push(`- warning delta: ${baselineDelta.warningCountDelta >= 0 ? '+' : ''}${baselineDelta.warningCountDelta}`)
        }

        lines.push('')
        lines.push('### 目录分布')
        if (rule.directoryBuckets.length === 0) {
            lines.push('- 无')
        } else {
            for (const bucket of rule.directoryBuckets.slice(0, 15)) {
                lines.push(`- ${bucket.directory}: 命中 ${bucket.hitCount}, 清零 ${bucket.clearedCount}, warning 基线 ${bucket.warningBaseline}`)
            }
        }

        lines.push('')
        lines.push('### Residual Warnings')
        if (rule.residualWarnings.length === 0) {
            lines.push('- 无')
        } else {
            for (const warning of rule.residualWarnings.slice(0, 20)) {
                lines.push(`- ${warning.filePath}:${warning.line}:${warning.column} ${warning.message}`)
            }
        }

        lines.push('')
        lines.push('### Explicit Exemptions')
        if (rule.explicitExemptions.length === 0) {
            lines.push('- 无')
        } else {
            for (const exemption of rule.explicitExemptions.slice(0, 20)) {
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
    const report = await collectEslintRulesInventory({ baseline })
    const artifacts = await writeArtifacts(report, output)

    console.info('ESLint rules inventory completed.')
    console.info(`- warning 总数: ${report.summary.warningCount}`)
    console.info(`- 显式豁免总数: ${report.summary.explicitExemptionCount}`)
    console.info(`- JSON: ${toPosixPath(artifacts.jsonPath)}`)
    console.info(`- Markdown: ${toPosixPath(artifacts.markdownPath)}`)

    return report
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
