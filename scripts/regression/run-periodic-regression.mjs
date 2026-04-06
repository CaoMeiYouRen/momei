import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')
const regressionLogPath = path.join(repoRoot, 'docs', 'plan', 'regression-log.md')
const artifactDir = path.join(repoRoot, 'artifacts', 'review-gate')

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
            '文档: @documentation-specialist 将结果摘要沉淀到 docs/plan/regression-log.md，不再另建散落记录。',
        ],
        steps: [
            createPnpmStep('test:coverage', 'test:coverage', { timeoutBudget: '30m' }),
            createPnpmStep('security:audit-deps', 'security:audit-deps', { timeoutBudget: '10m' }),
            createPnpmStep('docs:check:source-of-truth', 'docs:check:source-of-truth', { timeoutBudget: '10m' }),
            createPnpmStep('docs:check:i18n', 'docs:check:i18n', { timeoutBudget: '10m' }),
            createPnpmStep('duplicate-code:check', 'duplicate-code:check', { required: false, timeoutBudget: '10m' }),
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
            '文档: 结果摘要继续写入 docs/plan/regression-log.md，引用 artifacts/review-gate/ 证据，不复制第二份正文。',
        ],
        steps: [
            createPnpmStep('release:check:full', 'release:check:full', { timeoutBudget: '60m' }),
            createPnpmStep('docs:check:i18n', 'docs:check:i18n', { timeoutBudget: '10m' }),
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

        const summary = `${result.label} failed`
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

export function buildEvidence({ artifactJsonPath, artifactMarkdownPath, dryRun = false, logHealth, mode, profile, results, summary }) {
    const lines = [
        `# Review Gate Record — ${profile.key} periodic regression`,
        '',
        `- 范围: ${profile.title}`,
        `- 调度入口: pnpm regression:${profile.key}`,
        '- 关联 Todo: 主线2 - 周期性回归任务实盘化',
        '- 改动类型: 周期性回归 / 质量门 / 文档同步 / 调度编排',
        `- 风险等级: ${profile.key === 'weekly' ? '中' : '高'}`,
        `- 记录路径: ${path.relative(repoRoot, artifactMarkdownPath)}`,
        `- JSON 摘要: ${path.relative(repoRoot, artifactJsonPath)}`,
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
    lines.push('- 本轮结果摘要应继续沉淀到 docs/plan/regression-log.md。')
    lines.push('- 当活动日志超过窗口时，先滚动迁移旧记录到 docs/plan/regression-log-archive.md，再继续推进阶段收口。')
    lines.push('- 不新增第二套周期性回归正文文档；artifact 仅作为引用证据。')
    lines.push('')

    return lines.join('\n')
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

async function writeArtifacts({ evidence, profile, summary, results, logHealth }) {
    await mkdir(artifactDir, { recursive: true })
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
    const profile = resolveRegressionProfile(options.profile)
    const dateStr = new Date().toISOString().slice(0, 10)
    const artifactBaseName = `${dateStr}-${profile.key}-regression`
    profile.artifactMarkdownPath = path.join(artifactDir, `${artifactBaseName}.md`)
    profile.artifactJsonPath = path.join(artifactDir, `${artifactBaseName}.json`)
    const logContent = await readFile(regressionLogPath, 'utf8')
    const logHealth = assessRegressionLogWindow(logContent)
    const results = []

    console.info(`\n${'─'.repeat(60)}`)
    console.info(`  墨梅博客 - ${profile.title}`)
    console.info(`  profile: ${profile.key}  |  mode: ${options.mode}`)
    console.info(`  dry-run: ${options.dryRun ? '是' : '否'}`)
    console.info(`  trigger: ${profile.triggerCondition}`)
    console.info(`${'─'.repeat(60)}\n`)

    for (const step of profile.steps) {
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
        profile,
        results,
    })

    const evidence = buildEvidence({
        artifactJsonPath: profile.artifactJsonPath,
        artifactMarkdownPath: profile.artifactMarkdownPath,
        dryRun: options.dryRun,
        logHealth,
        mode: options.mode,
        profile,
        results,
        summary,
    })
    const artifacts = await writeArtifacts({ evidence, profile, results, summary, logHealth })

    console.info(`\nReview Gate: ${summary.conclusion}`)
    console.info(`Artifacts: ${path.relative(repoRoot, artifacts.artifactMarkdownPath)}, ${path.relative(repoRoot, artifacts.artifactJsonPath)}`)

    if (summary.conclusion === 'Reject' && options.mode === 'error') {
        process.exit(1)
    }

    return {
        artifacts,
        logHealth,
        profile,
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
