import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')

const DEFAULT_SCOPE = 'duplicate-code'
const DEFAULT_CONFIG_PATH = '.jscpd.json'
const DEFAULT_BASELINE_PATH = '.github/review-gate/duplicate-code-baseline.json'

function parseArgs(argv = process.argv) {
    const args = argv.slice(2)
    const mode = args.find((arg) => arg.startsWith('--mode='))?.slice('--mode='.length) ?? 'warn'
    const config = args.find((arg) => arg.startsWith('--config='))?.slice('--config='.length) ?? DEFAULT_CONFIG_PATH
    const baseline = args.find((arg) => arg.startsWith('--baseline='))?.slice('--baseline='.length) ?? DEFAULT_BASELINE_PATH
    const input = args.find((arg) => arg.startsWith('--input='))?.slice('--input='.length) ?? null
    const scopeArg = args.find((arg) => arg.startsWith('--scope='))?.slice('--scope='.length) ?? DEFAULT_SCOPE
    const scope = sanitizeScope(scopeArg) || DEFAULT_SCOPE

    if (!['warn', 'error'].includes(mode)) {
        throw new Error(`[duplicate-code-gate] 不支持的模式: ${mode}，请使用 warn 或 error`)
    }

    return { baseline, config, input, mode, scope }
}

function sanitizeScope(scope) {
    return scope.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function normalizePath(filePath) {
    return String(filePath || '').replace(/\\/g, '/')
}

function roundNumber(value) {
    return Number(Number(value || 0).toFixed(2))
}

async function loadJson(filePath) {
    const content = await readFile(filePath, 'utf8')
    return JSON.parse(content)
}

async function loadJsonIfExists(filePath) {
    try {
        return await loadJson(filePath)
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
            return null
        }

        throw error
    }
}

function ensureObject(value, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`[duplicate-code-gate] ${label} 缺失或格式无效`)
    }

    return value
}

function normalizeStats(stats) {
    const source = ensureObject(stats, 'statistics.total')

    return {
        clones: Number(source.clones || 0),
        duplicatedLines: Number(source.duplicatedLines || 0),
        duplicatedTokens: Number(source.duplicatedTokens || 0),
        lines: Number(source.lines || 0),
        newClones: Number(source.newClones || 0),
        newDuplicatedLines: Number(source.newDuplicatedLines || 0),
        percentage: roundNumber(source.percentage || 0),
        percentageTokens: roundNumber(source.percentageTokens || 0),
        sources: Number(source.sources || 0),
        tokens: Number(source.tokens || 0),
    }
}

function previewFragment(fragment) {
    const compact = String(fragment || '').replace(/\s+/g, ' ').trim()

    if (compact.length <= 160) {
        return compact
    }

    return `${compact.slice(0, 157)}...`
}

function normalizeDuplicateEntry(entry, index) {
    const source = ensureObject(entry, `duplicates[${index}]`)
    const firstFile = ensureObject(source.firstFile, `duplicates[${index}].firstFile`)
    const secondFile = ensureObject(source.secondFile, `duplicates[${index}].secondFile`)

    return {
        firstFile: {
            endLine: Number(firstFile.endLoc?.line ?? firstFile.end ?? 0),
            name: normalizePath(firstFile.name),
            startLine: Number(firstFile.startLoc?.line ?? firstFile.start ?? 0),
        },
        format: source.format || 'unknown',
        fragmentPreview: previewFragment(source.fragment),
        id: index + 1,
        lines: Number(source.lines || 0),
        secondFile: {
            endLine: Number(secondFile.endLoc?.line ?? secondFile.end ?? 0),
            name: normalizePath(secondFile.name),
            startLine: Number(secondFile.startLoc?.line ?? secondFile.start ?? 0),
        },
        tokens: Number(source.tokens || 0),
    }
}

function collectTopFiles(formats) {
    const normalizedFormats = ensureObject(formats, 'statistics.formats')
    const entries = []

    for (const [formatName, formatValue] of Object.entries(normalizedFormats)) {
        const sources = ensureObject(formatValue?.sources ?? {}, `statistics.formats.${formatName}.sources`)

        for (const [filePath, fileStats] of Object.entries(sources)) {
            const normalizedFileStats = normalizeStats(fileStats)

            if (normalizedFileStats.clones === 0 && normalizedFileStats.duplicatedLines === 0) {
                continue
            }

            entries.push({
                ...normalizedFileStats,
                format: formatName,
                name: normalizePath(filePath),
            })
        }
    }

    return entries
        .sort((left, right) => {
            if (right.duplicatedLines !== left.duplicatedLines) {
                return right.duplicatedLines - left.duplicatedLines
            }

            if (right.percentage !== left.percentage) {
                return right.percentage - left.percentage
            }

            return left.name.localeCompare(right.name)
        })
}

function normalizeJscpdReport(rawReport) {
    const report = ensureObject(rawReport, 'jscpd report')
    const statistics = ensureObject(report.statistics, 'statistics')
    const duplicates = Array.isArray(report.duplicates) ? report.duplicates : []

    const normalizedDuplicates = duplicates
        .map(normalizeDuplicateEntry)
        .sort((left, right) => {
            if (right.lines !== left.lines) {
                return right.lines - left.lines
            }

            return left.firstFile.name.localeCompare(right.firstFile.name)
        })

    return {
        detectionDate: statistics.detectionDate || new Date().toISOString(),
        topDuplicates: normalizedDuplicates.slice(0, 20),
        topFiles: collectTopFiles(statistics.formats).slice(0, 20),
        total: normalizeStats(statistics.total),
        totalDuplicates: normalizedDuplicates.length,
    }
}

function evaluateDuplicateCodeGate({ baseline, normalizedReport, mode }) {
    const hasBaseline = Number.isFinite(baseline?.totalPercentage) && Number.isFinite(baseline?.clones)
    const tolerancePercentage = Number.isFinite(baseline?.tolerancePercentage) ? Number(baseline.tolerancePercentage) : 0
    const toleranceClones = Number.isFinite(baseline?.toleranceClones) ? Number(baseline.toleranceClones) : 0
    const allowedPercentage = hasBaseline ? roundNumber(Number(baseline.totalPercentage) + tolerancePercentage) : null
    const allowedClones = hasBaseline ? Number(baseline.clones) + toleranceClones : null
    const exceededBaseline = hasBaseline && (
        normalizedReport.total.percentage > allowedPercentage
        || normalizedReport.total.clones > allowedClones
    )
    const findings = []

    if (!hasBaseline) {
        findings.push({
            level: 'warning',
            message: '当前尚未建立重复代码基线；本轮只产出首份可追溯报告，不执行回归阻断。',
            title: '缺少重复代码基线',
        })
    }

    if (exceededBaseline) {
        findings.push({
            level: mode === 'error' ? 'blocker' : 'warning',
            message: `总重复率 ${normalizedReport.total.percentage}% / clones ${normalizedReport.total.clones} 超过基线允许值 ${allowedPercentage}% / ${allowedClones}。`,
            title: '重复代码统计超过基线容差',
        })
    }

    return {
        allowedClones,
        allowedPercentage,
        exceededBaseline,
        findings,
        gateConclusion: exceededBaseline && mode === 'error' ? 'Reject' : 'Pass',
        hasBaseline,
        mode,
        toleranceClones,
        tolerancePercentage,
    }
}

function buildArtifactPaths({ dateStr, scope }) {
    const prefix = `${dateStr}-${scope}`

    return {
        json: path.join(repoRoot, 'artifacts', 'review-gate', `${prefix}.json`),
        md: path.join(repoRoot, 'artifacts', 'review-gate', `${prefix}.md`),
    }
}

function renderMarkdownReport({ artifactPaths, baseline, baselinePath, config, configPath, evaluation, normalizedReport }) {
    const lines = [
        '# Review Gate Record — duplicate-code',
        '',
        '- 范围: 重复代码检测自动化补强',
        '- 关联 Todo: 主线4 - 重复代码检测自动化补强',
        '- 改动类型: 脚本 / 质量门 / 治理基线',
        '- 风险等级: 中（默认以 warn 方式建立基线）',
        `- 记录路径: ${normalizePath(path.relative(repoRoot, artifactPaths.md))}`,
        `- 工具: jscpd`,
        `- 配置文件: ${normalizePath(path.relative(repoRoot, configPath))}`,
        `- 基线路径: ${normalizePath(path.relative(repoRoot, baselinePath))}`,
        `- 扫描时间: ${normalizedReport.detectionDate}`,
        '',
        '## Scan Summary',
        '',
        `- 模式: ${evaluation.mode}`,
        `- 扫描文件模式: ${config.files.join(', ')}`,
        `- 忽略模式: ${config.ignore.join(', ')}`,
        `- 最小块大小: ${config.minLines} lines / ${config.minTokens} tokens`,
        `- 总文件数: ${normalizedReport.total.sources}`,
        `- 总重复片段数: ${normalizedReport.totalDuplicates}`,
        `- 总 clones: ${normalizedReport.total.clones}`,
        `- 总重复行数: ${normalizedReport.total.duplicatedLines}`,
        `- 总重复率: ${normalizedReport.total.percentage}%`,
        '',
        '## Baseline',
        '',
    ]

    if (evaluation.hasBaseline) {
        lines.push(`- 基线总重复率: ${roundNumber(Number(baseline.totalPercentage))}%`)
        lines.push(`- 当前总重复率: ${normalizedReport.total.percentage}%`)
        lines.push(`- 基线允许上限: ${evaluation.allowedPercentage}%`)
        lines.push(`- 基线 clones: ${Number(baseline.clones)}`)
        lines.push(`- 当前 clones: ${normalizedReport.total.clones}`)
        lines.push(`- 基线允许 clones: ${evaluation.allowedClones}`)
        lines.push(`- 结论: ${evaluation.exceededBaseline ? '超过基线容差' : '未超过基线容差'}`)
    } else {
        lines.push('- 基线状态: 尚未建立，本轮作为首轮 report 与人工分级输入。')
        lines.push(`- 建议动作: 复核报告后把当前统计写入 ${normalizePath(path.relative(repoRoot, baselinePath))}，后续按 tolerance 做 warn / error 对比。`)
    }

    lines.push('')
    lines.push('## Top Duplicates')
    lines.push('')

    if (normalizedReport.topDuplicates.length === 0) {
        lines.push('- 无命中重复片段。')
    } else {
        normalizedReport.topDuplicates.forEach((duplicate, index) => {
            lines.push(`${index + 1}. ${duplicate.firstFile.name}:${duplicate.firstFile.startLine}-${duplicate.firstFile.endLine} <-> ${duplicate.secondFile.name}:${duplicate.secondFile.startLine}-${duplicate.secondFile.endLine}`)
            lines.push(`   - format: ${duplicate.format}`)
            lines.push(`   - lines: ${duplicate.lines}`)
            lines.push(`   - preview: ${duplicate.fragmentPreview || '(empty fragment)'}`)
        })
    }

    lines.push('')
    lines.push('## Top Files')
    lines.push('')

    if (normalizedReport.topFiles.length === 0) {
        lines.push('- 无命中重复文件。')
    } else {
        normalizedReport.topFiles.forEach((file, index) => {
            lines.push(`${index + 1}. ${file.name}`)
            lines.push(`   - format: ${file.format}`)
            lines.push(`   - duplicated lines: ${file.duplicatedLines}`)
            lines.push(`   - clones: ${file.clones}`)
            lines.push(`   - percentage: ${file.percentage}%`)
        })
    }

    lines.push('')
    lines.push('## Findings')
    lines.push('')

    const findingsByLevel = {
        blocker: evaluation.findings.filter((item) => item.level === 'blocker'),
        warning: evaluation.findings.filter((item) => item.level === 'warning'),
        suggest: evaluation.findings.filter((item) => item.level === 'suggest'),
    }

    for (const level of ['blocker', 'warning', 'suggest']) {
        lines.push(`### ${level}`)

        if (findingsByLevel[level].length === 0) {
            lines.push('无')
        } else {
            findingsByLevel[level].forEach((finding, index) => {
                lines.push(`${index + 1}. ${finding.title}`)
                lines.push(`   - ${finding.message}`)
            })
        }

        lines.push('')
    }

    lines.push('## Review Gate')
    lines.push('')
    lines.push(`- 结论: ${evaluation.gateConclusion}`)
    lines.push(`- 失败原因或通过条件: ${evaluation.exceededBaseline ? '当前统计超过基线容差，需复核报告并收敛重复片段后重跑。' : '当前统计未超过已知基线，或本轮仅进行首轮基线建立。'}`)
    lines.push(`- 本轮新增问题: ${evaluation.findings.length}`)
    lines.push(`- 未覆盖边界: 当前默认不扫描 tests、docs、i18n、镜像技能目录与构建产物；测试样板、文档翻译镜像与外部镜像目录不纳入首轮重复代码治理口径。`)
    lines.push('- 后续补跑计划: 基于本轮 top duplicates 做人工分级后，决定是抽 shared helper、延后治理，还是继续保持局部实现。')
    lines.push('')

    return lines.join('\n')
}

async function runCommand(command, commandArgs) {
    return await new Promise((resolve) => {
        const start = Date.now()
        const isWin = process.platform === 'win32'
        const spawnCommand = isWin ? 'cmd.exe' : command
        const spawnArgs = isWin
            ? ['/d', '/s', '/c', [command, ...commandArgs].join(' ')]
            : commandArgs

        const chunks = []
        const child = spawn(spawnCommand, spawnArgs, {
            cwd: repoRoot,
            env: process.env,
            stdio: ['inherit', 'pipe', 'pipe'],
        })

        child.stdout.on('data', (data) => {
            process.stdout.write(data)
            chunks.push(data)
        })

        child.stderr.on('data', (data) => {
            process.stderr.write(data)
            chunks.push(data)
        })

        child.on('error', (error) => {
            resolve({
                durationMs: Date.now() - start,
                ok: false,
                output: error.message,
            })
        })

        child.on('exit', (code) => {
            resolve({
                durationMs: Date.now() - start,
                ok: code === 0,
                output: Buffer.concat(chunks).toString('utf8').trim(),
            })
        })
    })
}

async function runJscpd({ config, configPath }) {
    const outputDirectory = await mkdtemp(path.join(tmpdir(), 'momei-jscpd-'))
    const configuredPaths = Array.isArray(config.path) && config.path.length > 0 ? config.path : ['.']
    const args = ['exec', 'jscpd', '--config', configPath, '--output', outputDirectory, ...configuredPaths]

    try {
        const result = await runCommand('pnpm', args)

        if (!result.ok) {
            throw new Error(`[duplicate-code-gate] jscpd 扫描失败: ${result.output || 'unknown error'}`)
        }

        return await loadJson(path.join(outputDirectory, 'jscpd-report.json'))
    } finally {
        await rm(outputDirectory, { force: true, recursive: true })
    }
}

async function main() {
    const args = parseArgs(process.argv)
    const configPath = path.resolve(repoRoot, args.config)
    const baselinePath = path.resolve(repoRoot, args.baseline)
    const dateStr = new Date().toISOString().slice(0, 10)
    const artifactPaths = buildArtifactPaths({ dateStr, scope: args.scope })
    const config = ensureObject(await loadJson(configPath), 'jscpd config')
    const rawReport = args.input
        ? await loadJson(path.resolve(repoRoot, args.input))
        : await runJscpd({ config, configPath })
    const normalizedReport = normalizeJscpdReport(rawReport)
    const baseline = await loadJsonIfExists(baselinePath)
    const evaluation = evaluateDuplicateCodeGate({ baseline, mode: args.mode, normalizedReport })
    const markdown = renderMarkdownReport({
        artifactPaths,
        baseline,
        baselinePath,
        config,
        configPath,
        evaluation,
        normalizedReport,
    })
    const normalizedArtifact = {
        baseline: baseline
            ? {
                clones: Number(baseline.clones),
                totalPercentage: roundNumber(Number(baseline.totalPercentage)),
                toleranceClones: Number(baseline.toleranceClones || 0),
                tolerancePercentage: roundNumber(Number(baseline.tolerancePercentage || 0)),
                updatedAt: baseline.updatedAt || null,
            }
            : null,
        config: {
            files: Array.isArray(config.files) ? config.files : [],
            ignore: Array.isArray(config.ignore) ? config.ignore : [],
            minLines: Number(config.minLines || 0),
            minTokens: Number(config.minTokens || 0),
        },
        generatedAt: new Date().toISOString(),
        gate: evaluation,
        report: normalizedReport,
        scope: args.scope,
        tool: 'jscpd',
    }

    await mkdir(path.dirname(artifactPaths.json), { recursive: true })
    await writeFile(artifactPaths.json, `${JSON.stringify(normalizedArtifact, null, 2)}\n`, 'utf8')
    await writeFile(artifactPaths.md, `${markdown}\n`, 'utf8')

    console.info('Duplicate Code Gate')
    console.info(`- mode: ${args.mode}`)
    console.info(`- total sources: ${normalizedReport.total.sources}`)
    console.info(`- total duplicates: ${normalizedReport.totalDuplicates}`)
    console.info(`- total clones: ${normalizedReport.total.clones}`)
    console.info(`- duplicated lines: ${normalizedReport.total.duplicatedLines}`)
    console.info(`- duplication percentage: ${normalizedReport.total.percentage}%`)
    console.info(`- baseline status: ${evaluation.hasBaseline ? 'configured' : 'missing'}`)
    console.info(`- review gate: ${evaluation.gateConclusion}`)
    console.info(`- JSON artifact: ${normalizePath(path.relative(repoRoot, artifactPaths.json))}`)
    console.info(`- Markdown artifact: ${normalizePath(path.relative(repoRoot, artifactPaths.md))}`)

    if (evaluation.gateConclusion === 'Reject') {
        process.exitCode = 1
    }
}

export {
    evaluateDuplicateCodeGate,
    normalizeJscpdReport,
    parseArgs,
    previewFragment,
}

if (isDirectExecution(import.meta.url)) {
    main().catch((error) => {
        console.error(error.message)
        process.exitCode = 1
    })
}
