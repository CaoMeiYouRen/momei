import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'
import {
    resolveRegressionWindowPath,
    toPosixRelativePath,
    upsertRegressionWindowEntry,
} from '../shared/regression-window.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')

export const LOG_WINDOW_LIMITS = {
    maxEntries: 8,
    maxLines: 400,
}

const NON_RECORD_HEADINGS = new Set([
    '当前窗口与索引',
    '维护规则',
    '归档规则',
])

function createPnpmStep(label, script, options = {}) {
    const passthroughArgs = options.passthroughArgs ?? []
    const commandArgs = ['run', script]

    if (passthroughArgs.length > 0) {
        commandArgs.push('--', ...passthroughArgs)
    }

    return {
        command: 'pnpm',
        commandArgs,
        label,
        required: options.required ?? true,
        timeoutBudget: options.timeoutBudget ?? '10m',
    }
}

function extractNestedFailureLabel(output, label) {
    const normalizedOutput = typeof output === 'string' ? output : ''

    if (label === 'release:check:full' || label === 'release:check') {
        const fatalMatch = normalizedOutput.match(/\[pre-release-check\]\s+致命错误:\s+"([^"]+)"\s+失败/u)

        if (fatalMatch) {
            return fatalMatch[1]
        }
    }

    return null
}

export function resolveRegressionFailureSummary(result) {
    const nestedFailureLabel = extractNestedFailureLabel(result.output, result.label)

    if (nestedFailureLabel) {
        return `${result.label} failed -> ${nestedFailureLabel}`
    }

    return `${result.label} failed`
}

export const PERIODIC_REGRESSION_PROFILES = {
    weekly: {
        archivePolicy: 'warn',
        executionFrequency: '每周一次',
        key: 'weekly',
        title: '周级周期性回归',
        triggerCondition: '每周固定治理窗口，或质量债、文档漂移、依赖风险出现连续积压时执行。',
        responsibilityBoundary: [
            '主责: @full-stack-master 或当前值班开发者执行脚本入口。',
            '审计: @code-auditor 仅对 blocker / warning 结论做 Review Gate 复核，不替代命令执行。',
            '文档: @documentation-specialist 将结果摘要沉淀到 docs/reports/regression/current.md，不再另建散落记录。',
        ],
        steps: [
            createPnpmStep('test:coverage', 'test:coverage', { timeoutBudget: '30m' }),
            createPnpmStep('security:audit-deps', 'security:audit-deps', { timeoutBudget: '10m' }),
            createPnpmStep('docs:check:source-of-truth', 'docs:check:source-of-truth', { timeoutBudget: '10m' }),
            createPnpmStep('docs:check:i18n', 'docs:check:i18n', { timeoutBudget: '10m' }),
            createPnpmStep('docs:check:line-count', 'docs:check:line-count', { timeoutBudget: '10m' }),
            createPnpmStep('i18n:audit:missing', 'i18n:audit:missing', { timeoutBudget: '10m' }),
            createPnpmStep('duplicate-code:check', 'duplicate-code:check', { required: false, timeoutBudget: '10m' }),
            createPnpmStep('governance:check:scripts', 'governance:check:scripts', { required: false, timeoutBudget: '10m' }),
            createPnpmStep('governance:audit:eslint-debt', 'governance:audit:eslint-debt', { required: false, timeoutBudget: '5m' }),
            createPnpmStep('governance:audit:comment-drift', 'governance:audit:comment-drift', { required: false, timeoutBudget: '5m' }),
        ],
    },
    'pre-release': {
        archivePolicy: 'warn',
        executionFrequency: '每次发版前',
        key: 'pre-release',
        title: '发版前周期性回归',
        triggerCondition: '准备执行 release、打 tag 或合并需要发布的收口变更前执行。',
        responsibilityBoundary: [
            '主责: @full-stack-master 负责跑完整发版前回归入口并确认结果。',
            '审计: @code-auditor 对 release blocker 结论做放行或退回判断。',
            '文档: 结果摘要继续写入 docs/reports/regression/current.md，引用 artifacts/review-gate/ 证据，不复制第二份正文。',
        ],
        steps: [
            createPnpmStep('release:check:full', 'release:check:full', { timeoutBudget: '60m' }),
            createPnpmStep('docs:check:i18n', 'docs:check:i18n', { timeoutBudget: '10m' }),
            createPnpmStep('docs:check:line-count', 'docs:check:line-count', { timeoutBudget: '10m' }),
            createPnpmStep('test:perf:budget:strict', 'test:perf:budget:strict', { timeoutBudget: '10m' }),
            createPnpmStep('duplicate-code:check', 'duplicate-code:check', { required: false, timeoutBudget: '10m' }),
        ],
    },
    'phase-close': {
        archivePolicy: 'block',
        executionFrequency: '阶段收口前',
        key: 'phase-close',
        title: '阶段收口前周期性回归',
        triggerCondition: 'todo 主线接近收口、准备归档当前阶段，或需要形成当前阶段放行结论时执行。',
        responsibilityBoundary: [
            '主责: @full-stack-master 执行阶段收口前回归并补齐 Review Gate 证据。',
            '审计: @code-auditor 必须给出 Pass / Reject 结论；若存在 blocker 不得宣称阶段可归档。',
            '文档: @documentation-specialist / @todo-manager 仅在本轮通过后更新 todo、归档与 roadmap 状态。',
        ],
        steps: [
            createPnpmStep('test:coverage', 'test:coverage', { timeoutBudget: '30m' }),
            createPnpmStep('release:check:full', 'release:check:full', { timeoutBudget: '60m' }),
            createPnpmStep('docs:check:i18n', 'docs:check:i18n', { timeoutBudget: '10m' }),
            createPnpmStep('docs:check:line-count', 'docs:check:line-count', { timeoutBudget: '10m' }),
            createPnpmStep('test:perf:budget:strict', 'test:perf:budget:strict', { timeoutBudget: '10m' }),
            createPnpmStep('duplicate-code:check:strict', 'duplicate-code:check:strict', { timeoutBudget: '10m' }),
            createPnpmStep('review-gate:generate:check', 'review-gate:generate:check', {
                passthroughArgs: ['--scope=phase-close-regression'],
                timeoutBudget: '20m',
            }),
        ],
    },
}

export function resolveRegressionProfile(profile) {
    const nextProfile = PERIODIC_REGRESSION_PROFILES[profile]

    if (!nextProfile) {
        throw new Error(`Unsupported regression profile: ${profile}`)
    }

    return nextProfile
}

export function assessRegressionLogWindow(content) {
    const lines = content.split('\n')
    const recordHeadings = lines
        .filter((line) => line.startsWith('## '))
        .map((line) => line.slice(3).trim())
        .filter((heading) => !NON_RECORD_HEADINGS.has(heading))

    const reasons = []

    if (lines.length > LOG_WINDOW_LIMITS.maxLines) {
        reasons.push(`活动日志当前 ${lines.length} 行，超过 ${LOG_WINDOW_LIMITS.maxLines} 行窗口`)
    }

    if (recordHeadings.length > LOG_WINDOW_LIMITS.maxEntries) {
        reasons.push(`活动日志当前 ${recordHeadings.length} 条记录，超过 ${LOG_WINDOW_LIMITS.maxEntries} 条窗口`)
    }

    return {
        entryCount: recordHeadings.length,
        lineCount: lines.length,
        recordHeadings,
        reasons,
        shouldArchive: reasons.length > 0,
    }
}

export function summarizeRegressionRun({ dryRun = false, logHealth, profile, results }) {
    const blockers = []
    const warnings = []

    for (const result of results) {
        if (result.ok || result.skipped) {
            continue
        }

        const summary = resolveRegressionFailureSummary(result)
        if (result.required) {
            blockers.push(summary)
        } else {
            warnings.push(summary)
        }
    }

    if (logHealth.shouldArchive) {
        const archiveSummary = `regression-log window exceeded: ${logHealth.reasons.join('；')}`
        if (profile.archivePolicy === 'block') {
            blockers.push(archiveSummary)
        } else {
            warnings.push(archiveSummary)
        }
    }

    let conclusion = 'Pass'
    if (dryRun) {
        conclusion = blockers.length > 0 ? 'Reject' : 'Prepared'
    } else if (blockers.length > 0) {
        conclusion = 'Reject'
    }

    return {
        blockers,
        conclusion,
        warnings,
    }
}

export function buildEvidence({ artifactJsonPath, artifactMarkdownPath, dryRun = false, logHealth, mode, profile, projectRoot = repoRoot, results, summary }) {
    const lines = [
        `# Review Gate Record — ${profile.key} periodic regression`,
        '',
        `- 范围: ${profile.title}`,
        `- 调度入口: pnpm regression:${profile.key}`,
        '- 关联 Todo: 主线2 - 周期性回归任务实盘化',
        '- 改动类型: 周期性回归 / 质量门 / 文档同步 / 调度编排',
        `- 风险等级: ${profile.key === 'weekly' ? '中' : '高'}`,
        `- 记录路径: ${path.relative(projectRoot, artifactMarkdownPath)}`,
        `- JSON 摘要: ${path.relative(projectRoot, artifactJsonPath)}`,
        `- 执行时间: ${new Date().toISOString()}`,
        `- 模式: ${mode}`,
        `- dry-run: ${dryRun ? '是' : '否'}`,
        '',
        '## 调度口径',
        '',
        `- 触发条件: ${profile.triggerCondition}`,
        `- 执行频率: ${profile.executionFrequency}`,
        '- 责任边界:',
    ]

    for (const item of profile.responsibilityBoundary) {
        lines.push(`  - ${item}`)
    }

    lines.push('')
    lines.push('## 已执行命令')
    lines.push('')

    for (const result of results) {
        const commandText = [result.command, ...result.commandArgs].join(' ')
        let status = 'FAIL'
        if (result.skipped) {
            status = 'DRY RUN'
        } else if (result.ok) {
            status = 'PASS'
        }
        lines.push(`- ${commandText}`)
        lines.push(`  - 结果: ${status}`)
        lines.push(`  - timeout budget: ${result.timeoutBudget}`)

        if (!result.ok && !result.skipped) {
            const nestedFailureLabel = extractNestedFailureLabel(result.output, result.label)

            if (nestedFailureLabel) {
                lines.push(`  - 失败定位: ${nestedFailureLabel}`)
            }
        }
    }

    lines.push('')
    lines.push('## 回归日志窗口')
    lines.push('')
    lines.push(`- 当前活动日志: ${logHealth.lineCount} 行 / ${logHealth.entryCount} 条记录`)
    lines.push(`- 滚动归档阈值: ${LOG_WINDOW_LIMITS.maxLines} 行或 ${LOG_WINDOW_LIMITS.maxEntries} 条记录`)
    lines.push(`- 归档判定: ${logHealth.shouldArchive ? '需要滚动归档' : '窗口健康'}`)
    if (logHealth.reasons.length > 0) {
        for (const reason of logHealth.reasons) {
            lines.push(`  - ${reason}`)
        }
    }

    lines.push('')
    lines.push('## Review Gate')
    lines.push('')
    lines.push(`- 结论: ${summary.conclusion}`)
    lines.push(`- blocker 数量: ${summary.blockers.length}`)
    lines.push(`- warning 数量: ${summary.warnings.length}`)
    lines.push('- blocker 规则:')
    lines.push('  - 任一 required 命令失败直接升级为 blocker。')
    lines.push(`  - 阶段收口前 profile 在活动日志超过 ${LOG_WINDOW_LIMITS.maxLines} 行或 ${LOG_WINDOW_LIMITS.maxEntries} 条记录时，归档未完成即视为 blocker。`)

    lines.push('')
    lines.push('## Findings')
    lines.push('')
    lines.push('### blocker')
    if (summary.blockers.length === 0) {
        lines.push('- 无')
    } else {
        for (const blocker of summary.blockers) {
            lines.push(`- ${blocker}`)
        }
    }

    lines.push('')
    lines.push('### warning')
    if (summary.warnings.length === 0) {
        lines.push('- 无')
    } else {
        for (const warning of summary.warnings) {
            lines.push(`- ${warning}`)
        }
    }

    lines.push('')
    lines.push('## 记录落点')
    lines.push('')
    lines.push('- 本轮结果摘要应继续沉淀到 docs/reports/regression/current.md。')
    lines.push('- 当活动日志超过窗口时，先滚动迁移旧记录到 docs/reports/regression/archive/，再继续推进阶段收口。')
    lines.push('- 不新增第二套周期性回归正文文档；artifact 仅作为引用证据。')
    lines.push('')

    return lines.join('\n')
}

function formatFindingList(items) {
    return items.length > 0 ? items.join('；') : '无'
}

function resolveGateSeverity(summary) {
    if (summary.blockers.length > 0) {
        return 'blocker'
    }

    if (summary.warnings.length > 0) {
        return 'warning'
    }

    return 'none'
}

function formatRegressionResultStatus(result) {
    if (result.skipped) {
        return 'DRY RUN'
    }

    return result.ok ? 'PASS' : 'FAIL'
}

function formatUncoveredBoundary(dryRun, logHealth) {
    if (dryRun) {
        return '本轮为 dry-run，仅验证编排与回填，不代表真实回归执行结果。'
    }

    if (logHealth.shouldArchive) {
        return formatFindingList(logHealth.reasons)
    }

    return '无新增未覆盖边界。'
}

export function buildRegressionWindowEntry({
    artifactJsonPath,
    artifactMarkdownPath,
    dateStr,
    dryRun = false,
    logHealth,
    profile,
    projectRoot = repoRoot,
    results,
    summary,
}) {
    const regressionWindowPath = resolveRegressionWindowPath(projectRoot)
    const artifactMarkdownRelative = toPosixRelativePath(regressionWindowPath, artifactMarkdownPath)
    const artifactJsonRelative = toPosixRelativePath(regressionWindowPath, artifactJsonPath)
    const executedSummary = results
        .map((result) => `${result.label}=${formatRegressionResultStatus(result)}`)
        .join('，')

    return {
        body: [
            `- 执行入口: \`pnpm regression:${profile.key}${dryRun ? ' -- --dry-run' : ''}\``,
            `- 证据 artifact: [md](${artifactMarkdownRelative}) / [json](${artifactJsonRelative})`,
            `- 结果摘要: \`${summary.conclusion}\`；blocker=${summary.blockers.length}，warning=${summary.warnings.length}。`,
            `- 已执行验证: ${executedSummary || '无'}`,
            `- 回归窗口: ${logHealth.lineCount} 行 / ${logHealth.entryCount} 条，归档判定=${logHealth.shouldArchive ? '需要滚动归档' : '窗口健康'}。`,
            `- Review Gate: \`${summary.conclusion}\` / \`${resolveGateSeverity(summary)}\`；主要问题=${formatFindingList(summary.blockers.length > 0 ? summary.blockers : summary.warnings)}。`,
            `- 未覆盖边界: ${formatUncoveredBoundary(dryRun, logHealth)}`,
        ].join('\n'),
        id: `periodic-regression:${profile.key}:${dateStr}`,
        title: `${dateStr} ${profile.title}（自动回填）`,
    }
}

function formatDuration(durationMs) {
    return `${(durationMs / 1000).toFixed(1)}s`
}

async function runCommand(step) {
    return await new Promise((resolve) => {
        const start = Date.now()
        const isWin = process.platform === 'win32'
        const spawnCommand = isWin ? 'cmd.exe' : step.command
        const spawnArgs = isWin
            ? ['/d', '/s', '/c', [step.command, ...step.commandArgs].join(' ')]
            : step.commandArgs
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
                ...step,
                durationMs: Date.now() - start,
                ok: false,
                output: error.message,
                skipped: false,
            })
        })

        child.on('exit', (code) => {
            resolve({
                ...step,
                durationMs: Date.now() - start,
                ok: code === 0,
                output: Buffer.concat(chunks).toString('utf8').trim(),
                skipped: false,
            })
        })
    })
}

async function writeArtifacts({ artifactDirectory, evidence, profile, summary, results, logHealth }) {
    await mkdir(artifactDirectory, { recursive: true })
    await writeFile(profile.artifactMarkdownPath, evidence, 'utf8')
    await writeFile(profile.artifactJsonPath, JSON.stringify({
        profile: profile.key,
        generatedAt: new Date().toISOString(),
        logHealth,
        results: results.map((result) => ({
            command: result.command,
            commandArgs: result.commandArgs,
            durationMs: result.durationMs ?? 0,
            label: result.label,
            ok: result.ok,
            required: result.required,
            skipped: result.skipped ?? false,
            timeoutBudget: result.timeoutBudget,
        })),
        summary,
    }, null, 2), 'utf8')

    return {
        artifactJsonPath: profile.artifactJsonPath,
        artifactMarkdownPath: profile.artifactMarkdownPath,
    }
}

export async function runPeriodicRegression(options = {}) {
    const projectRoot = options.projectRoot ?? repoRoot
    const regressionLogPath = resolveRegressionWindowPath(projectRoot)
    const artifactDirectory = path.join(projectRoot, 'artifacts', 'review-gate')
    const profile = resolveRegressionProfile(options.profile)
    const dateStr = new Date().toISOString().slice(0, 10)
    const artifactBaseName = `${dateStr}-${profile.key}-regression`
    const resolvedProfile = {
        ...profile,
        artifactJsonPath: path.join(artifactDirectory, `${artifactBaseName}.json`),
        artifactMarkdownPath: path.join(artifactDirectory, `${artifactBaseName}.md`),
    }
    const logContent = await readFile(regressionLogPath, 'utf8')
    const logHealth = assessRegressionLogWindow(logContent)
    const results = []

    console.info(`\n${'─'.repeat(60)}`)
    console.info(`  墨梅博客 - ${resolvedProfile.title}`)
    console.info(`  profile: ${resolvedProfile.key}  |  mode: ${options.mode}`)
    console.info(`  dry-run: ${options.dryRun ? '是' : '否'}`)
    console.info(`  trigger: ${resolvedProfile.triggerCondition}`)
    console.info(`${'─'.repeat(60)}\n`)

    for (const step of resolvedProfile.steps) {
        console.info(`▶ [${step.label}] timeout budget ${step.timeoutBudget}`)

        if (options.dryRun) {
            console.info(`  DRY RUN  ${[step.command, ...step.commandArgs].join(' ')}`)
            results.push({
                ...step,
                durationMs: 0,
                ok: true,
                skipped: true,
            })
            continue
        }

        const result = await runCommand(step)
        results.push(result)
        console.info(`  ${result.ok ? 'PASS' : 'FAIL'}  ${step.label} (${formatDuration(result.durationMs)})`)

        if (!result.ok && step.required && options.mode === 'error') {
            console.error(`\n[periodic-regression] blocker: ${step.label} failed.`)
            break
        }
    }

    const summary = summarizeRegressionRun({
        dryRun: options.dryRun,
        logHealth,
        profile: resolvedProfile,
        results,
    })

    const evidence = buildEvidence({
        artifactJsonPath: resolvedProfile.artifactJsonPath,
        artifactMarkdownPath: resolvedProfile.artifactMarkdownPath,
        dryRun: options.dryRun,
        logHealth,
        mode: options.mode,
        profile: resolvedProfile,
        projectRoot,
        results,
        summary,
    })
    const artifacts = await writeArtifacts({
        artifactDirectory,
        evidence,
        profile: resolvedProfile,
        results,
        summary,
        logHealth,
    })

    await upsertRegressionWindowEntry(buildRegressionWindowEntry({
        artifactJsonPath: resolvedProfile.artifactJsonPath,
        artifactMarkdownPath: resolvedProfile.artifactMarkdownPath,
        dateStr,
        dryRun: options.dryRun,
        logHealth,
        profile: resolvedProfile,
        projectRoot,
        results,
        summary,
    }), {
        projectRoot,
    })

    console.info(`\nReview Gate: ${summary.conclusion}`)
    console.info(`Artifacts: ${path.relative(projectRoot, artifacts.artifactMarkdownPath)}, ${path.relative(projectRoot, artifacts.artifactJsonPath)}`)

    if (summary.conclusion === 'Reject' && options.mode === 'error') {
        process.exit(1)
    }

    return {
        artifacts,
        logHealth,
        profile: resolvedProfile,
        results,
        summary,
    }
}

async function main() {
    const options = parseCliOptions(process.argv, {
        defaults: {
            dryRun: false,
            mode: 'error',
            profile: null,
        },
        flags: {
            '--dry-run': { key: 'dryRun' },
        },
        values: {
            '--mode': {
                allowedValues: ['warn', 'error'],
                invalidMessage: (value) => `[periodic-regression] Unsupported mode: ${value}`,
                key: 'mode',
            },
            '--profile': {
                allowedValues: Object.keys(PERIODIC_REGRESSION_PROFILES),
                invalidMessage: (value) => `[periodic-regression] Unsupported profile: ${value}`,
                key: 'profile',
            },
        },
    })

    if (!options.profile) {
        throw new Error('[periodic-regression] Missing required --profile option')
    }

    await runPeriodicRegression(options)
}

if (isDirectExecution(import.meta.url)) {
    try {
        await main()
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error))
        process.exit(1)
    }
}
