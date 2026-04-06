import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'
import {
    evaluateDependencyRiskGate,
    loadAuditReport,
    normalizeSeverity,
    parseAuditReport,
    readAllowlist,
} from './check-dependency-risk.mjs'
import { loadLocalEnvFile } from './load-local-env.mjs'

const DEFAULTS = {
    allowlist: '.github/security/dependency-risk-allowlist.json',
    input: null,
    minSeverity: 'high',
    mode: 'warn',
    outputJson: 'artifacts/security/daily-dependency-audit/latest.json',
    outputMarkdown: 'artifacts/security/daily-dependency-audit/latest.md',
    registry: 'https://registry.npmjs.org/',
    runUrl: '',
}

function parseArgs(argv) {
    const args = parseCliOptions(argv, {
        defaults: { ...DEFAULTS },
        values: {
            '--allowlist': { key: 'allowlist' },
            '--input': { key: 'input' },
            '--min-severity': { key: 'minSeverity' },
            '--mode': {
                key: 'mode',
                allowedValues: ['warn', 'error'],
                invalidMessage: (value) => `Unsupported mode: ${value}`,
            },
            '--output-json': { key: 'outputJson' },
            '--output-markdown': { key: 'outputMarkdown' },
            '--registry': { key: 'registry' },
            '--run-url': { key: 'runUrl' },
        },
    })

    args.minSeverity = normalizeSeverity(args.minSeverity)
    return args
}

function isFixableRisk(risk) {
    if (typeof risk.patchedVersions === 'string') {
        const normalizedPatchedVersions = risk.patchedVersions.trim().toLowerCase()
        if (normalizedPatchedVersions && normalizedPatchedVersions !== 'unavailable' && normalizedPatchedVersions !== '<0.0.0') {
            return true
        }
    }

    return Boolean(
        typeof risk.recommendation === 'string'
        && risk.recommendation.trim()
        && risk.recommendation !== 'No direct upgrade recommendation from audit source'
        && risk.recommendation.trim().toLowerCase() !== 'none'
        && /^upgrade\b/i.test(risk.recommendation.trim()),
    )
}

function toSerializableRisk(risk) {
    return {
        advisoryId: risk.advisoryId,
        packageName: risk.packageName,
        severity: risk.severity,
        title: risk.title,
        source: risk.source,
        patchedVersions: risk.patchedVersions,
        recommendation: risk.recommendation,
        paths: risk.paths,
        fixable: isFixableRisk(risk),
    }
}

function buildRiskCounts(blockingRisks) {
    const fixableCount = blockingRisks.filter((risk) => risk.fixable).length
    return {
        blocking: blockingRisks.length,
        fixable: fixableCount,
        unfixable: blockingRisks.length - fixableCount,
    }
}

export function buildDailyDependencyAuditSummary({
    allowlist,
    generatedAt,
    minSeverity,
    registry,
    result,
    risks,
    runUrl,
}) {
    const blockingRisks = result.blocking.map(toSerializableRisk)
    const allowlistedRisks = result.allowlisted.map((item) => ({
        ...toSerializableRisk(item.risk),
        allowlistReason: item.allowlistEntry.reason,
        temporaryException: item.allowlistEntry.temporaryException,
    }))
    const counts = {
        relevant: result.relevantRisks.length,
        allowlisted: allowlistedRisks.length,
        ...buildRiskCounts(blockingRisks),
        total: risks.length,
    }

    if (blockingRisks.length === 0) {
        return {
            allowlist,
            conclusion: '无高危风险',
            counts,
            generatedAt,
            minSeverity,
            registry,
            runUrl,
            status: 'clean',
            summary: '当前 high 及以上依赖风险门禁通过。',
            allowlistedRisks,
            blockingRisks,
        }
    }

    return {
        allowlist,
        conclusion: counts.fixable > 0 ? '发现可修复风险' : '发现高危风险（暂无直接修复版本）',
        counts,
        generatedAt,
        minSeverity,
        registry,
        runUrl,
        status: 'risk_found',
        summary: counts.fixable > 0
            ? `发现 ${counts.fixable} 项可直接处理的 high+ 风险。`
            : '发现 high+ 风险，但当前审计结果未给出直接修复版本。',
        allowlistedRisks,
        blockingRisks,
    }
}

export function buildDailyDependencyAuditFailureSummary({
    allowlist,
    error,
    generatedAt,
    minSeverity,
    registry,
    runUrl,
}) {
    return {
        allowlist,
        conclusion: '审计执行失败',
        counts: {
            relevant: 0,
            allowlisted: 0,
            blocking: 0,
            fixable: 0,
            unfixable: 0,
            total: 0,
        },
        error: error instanceof Error ? error.message : String(error),
        generatedAt,
        minSeverity,
        registry,
        runUrl,
        status: 'audit_failed',
        summary: '依赖风险审计未能完成，需先排查 registry、网络或 pnpm audit 执行链路。',
        allowlistedRisks: [],
        blockingRisks: [],
    }
}

function renderRiskLines(risks) {
    if (risks.length === 0) {
        return ['- 无']
    }

    return risks.map((risk) => {
        const patch = risk.patchedVersions || 'unavailable'
        const pathSummary = Array.isArray(risk.paths) && risk.paths.length > 0
            ? `；路径: ${risk.paths.join(', ')}`
            : ''
        return `- ${risk.packageName} [${risk.severity}] ${risk.advisoryId}；patched: ${patch}${pathSummary}`
    })
}

export function renderDailyDependencyAuditMarkdown(summary) {
    const lines = [
        '# Daily Dependency Risk Audit',
        '',
        '## 结论',
        `- 状态: ${summary.conclusion}`,
        `- 摘要: ${summary.summary}`,
        `- 生成时间: ${summary.generatedAt}`,
        `- 数据源: pnpm audit (${summary.registry})`,
        `- 最小严重级别: ${summary.minSeverity}`,
        `- Allowlist: ${summary.allowlist}`,
        `- 运行链接: ${summary.runUrl || '未提供'}`,
        '',
        '## 统计',
        `- 总风险数: ${summary.counts.total}`,
        `- Relevant 风险数: ${summary.counts.relevant}`,
        `- Allowlist 放行: ${summary.counts.allowlisted}`,
        `- Blocking 风险: ${summary.counts.blocking}`,
        `- 可修复 Blocking 风险: ${summary.counts.fixable}`,
        `- 暂未给出补丁的 Blocking 风险: ${summary.counts.unfixable}`,
        '',
    ]

    if (summary.status === 'audit_failed') {
        lines.push('## 错误')
        lines.push(`- ${summary.error}`)
        lines.push('')
        lines.push('## 降级说明')
        lines.push('- 若告警 issue 创建失败，至少保留失败的 workflow run 与上传的 artifact 作为追溯基线。')
        return `${lines.join('\n')}\n`
    }

    lines.push('## Blocking Risks')
    lines.push(...renderRiskLines(summary.blockingRisks))
    lines.push('')
    lines.push('## Allowlisted Risks')
    lines.push(...renderRiskLines(summary.allowlistedRisks))
    lines.push('')
    lines.push('## 降级说明')
    lines.push('- 当仓库 issue 通知不可用时，回退到 failed workflow + artifact 追溯，不把告警静默吞掉。')

    return `${lines.join('\n')}\n`
}

async function ensureParentDirectory(filePath) {
    await mkdir(path.dirname(path.resolve(filePath)), { recursive: true })
}

async function writeOutputs(args, summary) {
    const [jsonPath, markdownPath] = [path.resolve(args.outputJson), path.resolve(args.outputMarkdown)]
    await Promise.all([
        ensureParentDirectory(jsonPath),
        ensureParentDirectory(markdownPath),
    ])

    await Promise.all([
        writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8'),
        writeFile(markdownPath, renderDailyDependencyAuditMarkdown(summary), 'utf8'),
    ])

    return { jsonPath, markdownPath }
}

async function runDailyDependencyAudit(args) {
    const [allowlistEntries, auditReport] = await Promise.all([
        readAllowlist(args.allowlist),
        loadAuditReport(args),
    ])
    const risks = parseAuditReport(auditReport)
    const result = evaluateDependencyRiskGate({
        risks,
        allowlistEntries,
        minSeverity: args.minSeverity,
    })

    return buildDailyDependencyAuditSummary({
        allowlist: args.allowlist,
        generatedAt: new Date().toISOString(),
        minSeverity: args.minSeverity,
        registry: args.registry,
        result,
        risks,
        runUrl: args.runUrl,
    })
}

async function main() {
    await loadLocalEnvFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'))

    const args = parseArgs(process.argv)
    let summary

    try {
        summary = await runDailyDependencyAudit(args)
    } catch (error) {
        summary = buildDailyDependencyAuditFailureSummary({
            allowlist: args.allowlist,
            error,
            generatedAt: new Date().toISOString(),
            minSeverity: args.minSeverity,
            registry: args.registry,
            runUrl: args.runUrl,
        })
    }

    const { jsonPath, markdownPath } = await writeOutputs(args, summary)

    console.info(`[dependency-risk-daily] ${summary.conclusion}`)
    console.info(`[dependency-risk-daily] JSON: ${jsonPath}`)
    console.info(`[dependency-risk-daily] Markdown: ${markdownPath}`)

    if (summary.status !== 'clean' && args.mode === 'error') {
        process.exitCode = 1
    }
}

export {
    parseArgs,
    runDailyDependencyAudit,
}

if (isDirectExecution(import.meta.url)) {
    main().catch((error) => {
        console.error(`[dependency-risk-daily] ${error.message}`)
        process.exitCode = 1
    })
}
