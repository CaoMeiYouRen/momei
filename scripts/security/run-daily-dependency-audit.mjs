import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'
import { DEPENDENCY_RISK_POLICY_KEYS, classifyDependencyRiskOutcome, resolveDependencyRiskPolicy } from './dependency-risk-policy.mjs'
import {
    evaluateAllowlistReviewDates,
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
    outputJson: 'artifacts/security/daily-dependency-audit/latest.json',
    outputMarkdown: 'artifacts/security/daily-dependency-audit/latest.md',
    policy: 'daily',
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
            '--policy': {
                key: 'policy',
                allowedValues: DEPENDENCY_RISK_POLICY_KEYS,
                invalidMessage: (value) => `Unsupported dependency risk policy: ${value}`,
            },
            '--registry': { key: 'registry' },
            '--run-url': { key: 'runUrl' },
        },
    })

    const policy = resolveDependencyRiskPolicy(args.policy)

    return {
        ...args,
        minSeverity: normalizeSeverity(args.minSeverity || policy.minSeverity),
        mode: args.mode || policy.defaultMode,
        policy: policy.key,
    }
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

/**
 * 把台账复核结果压成可序列化形态（只增可见性，不参与 severity / 退出码判定）。
 *
 * `daysUntil < 0` 为过期，`0..30` 为即将到期，其余为计划内；缺 `reviewBy` 单列。
 */
export function serializeAllowlistReview(review) {
    if (!review) {
        return null
    }

    const toItem = ({ daysUntil, entry }) => ({
        advisoryId: entry.advisoryId,
        daysUntil,
        packageName: entry.packageName,
        reviewBy: entry.reviewBy,
        severity: entry.severity,
    })

    return {
        today: review.today,
        counts: {
            dueSoon: review.dueSoon.length,
            expired: review.expired.length,
            missing: review.missing.length,
            scheduled: review.scheduled.length,
        },
        dueSoon: review.dueSoon.map(toItem),
        expired: review.expired.map(toItem),
        missing: review.missing.map((entry) => ({
            advisoryId: entry.advisoryId,
            packageName: entry.packageName,
            severity: entry.severity,
        })),
        scheduled: review.scheduled.map(toItem),
    }
}

/**
 * @param {unknown} [allowlistReview]
 */
export function buildDailyDependencyAuditSummary({
    allowlist,
    allowlistReview = null,
    generatedAt,
    minSeverity,
    policy,
    registry,
    result,
    risks,
    runUrl,
}) {
    const resolvedPolicy = typeof policy === 'string'
        ? resolveDependencyRiskPolicy(policy)
        : resolveDependencyRiskPolicy(policy.key)
    const blockingRisks = result.blocking.map(toSerializableRisk)
    const allowlistedRisks = result.allowlisted.map((item) => ({
        ...toSerializableRisk(item.risk),
        allowlistReason: item.allowlistEntry.reason,
        temporaryException: item.allowlistEntry.temporaryException,
    }))
    const reviewGate = classifyDependencyRiskOutcome({
        blockingRiskCount: blockingRisks.length,
        policy: resolvedPolicy,
    })
    const counts = {
        relevant: result.relevantRisks.length,
        allowlisted: allowlistedRisks.length,
        ...buildRiskCounts(blockingRisks),
        total: risks.length,
    }

    if (blockingRisks.length === 0) {
        return {
            allowlist,
            allowlistReview: serializeAllowlistReview(allowlistReview),
            conclusion: '无高危风险',
            counts,
            generatedAt,
            minSeverity,
            policy: {
                defaultMode: resolvedPolicy.defaultMode,
                findingLevels: resolvedPolicy.findingLevels,
                issueThreshold: resolvedPolicy.issueThreshold,
                key: resolvedPolicy.key,
                title: resolvedPolicy.title,
            },
            registry,
            requiresAttention: reviewGate.requiresAttention,
            reviewGate,
            runUrl,
            shouldOpenIssue: reviewGate.shouldOpenIssue,
            status: 'clean',
            summary: '当前 high 及以上依赖风险门禁通过。',
            allowlistedRisks,
            blockingRisks,
        }
    }

    return {
        allowlist,
        allowlistReview: serializeAllowlistReview(allowlistReview),
        conclusion: counts.fixable > 0 ? '发现可修复风险' : '发现高危风险（暂无直接修复版本）',
        counts,
        generatedAt,
        minSeverity,
        policy: {
            defaultMode: resolvedPolicy.defaultMode,
            findingLevels: resolvedPolicy.findingLevels,
            issueThreshold: resolvedPolicy.issueThreshold,
            key: resolvedPolicy.key,
            title: resolvedPolicy.title,
        },
        registry,
        requiresAttention: reviewGate.requiresAttention,
        reviewGate,
        runUrl,
        shouldOpenIssue: reviewGate.shouldOpenIssue,
        status: 'risk_found',
        summary: counts.fixable > 0
            ? `发现 ${counts.fixable} 项可直接处理的 high+ 风险。`
            : '发现 high+ 风险，但当前审计结果未给出直接修复版本。',
        allowlistedRisks,
        blockingRisks,
    }
}

/**
 * @param {unknown} [allowlistReview]
 */
export function buildDailyDependencyAuditFailureSummary({
    allowlist,
    allowlistReview = null,
    error,
    generatedAt,
    minSeverity,
    policy,
    registry,
    runUrl,
}) {
    const resolvedPolicy = typeof policy === 'string'
        ? resolveDependencyRiskPolicy(policy)
        : resolveDependencyRiskPolicy(policy.key)
    const reviewGate = classifyDependencyRiskOutcome({
        auditFailed: true,
        policy: resolvedPolicy,
    })

    return {
        allowlist,
        allowlistReview: serializeAllowlistReview(allowlistReview),
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
        policy: {
            defaultMode: resolvedPolicy.defaultMode,
            findingLevels: resolvedPolicy.findingLevels,
            issueThreshold: resolvedPolicy.issueThreshold,
            key: resolvedPolicy.key,
            title: resolvedPolicy.title,
        },
        registry,
        requiresAttention: reviewGate.requiresAttention,
        reviewGate,
        runUrl,
        shouldOpenIssue: reviewGate.shouldOpenIssue,
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
        `- 守护策略: ${summary.policy?.key || 'unknown'} (${summary.policy?.title || 'unknown policy'})`,
        `- Review Gate: ${summary.reviewGate?.conclusion || 'Pass'} / ${summary.reviewGate?.findingLevel || 'none'}`,
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

    const review = summary.allowlistReview
    if (review) {
        lines.push('## Allowlist 复核日期')
        lines.push(`- 基准日: ${review.today}`)
        lines.push(`- 过期: ${review.counts.expired} / 即将到期: ${review.counts.dueSoon} / 计划内: ${review.counts.scheduled} / 未登记: ${review.counts.missing}`)
        for (const item of review.expired) {
            lines.push(`- EXPIRED ${item.packageName} [${item.severity}] ${item.advisoryId}: reviewBy ${item.reviewBy}（已过期 ${Math.abs(item.daysUntil)} 天）`)
        }
        for (const item of review.dueSoon) {
            lines.push(`- DUE SOON ${item.packageName} [${item.severity}] ${item.advisoryId}: reviewBy ${item.reviewBy}（剩 ${item.daysUntil} 天）`)
        }
        for (const item of review.missing) {
            lines.push(`- MISSING ${item.packageName} [${item.severity}] ${item.advisoryId}: reviewBy 未登记`)
        }
        lines.push('')
    }

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
    const allowlistReview = evaluateAllowlistReviewDates({ allowlistEntries })

    return buildDailyDependencyAuditSummary({
        allowlist: args.allowlist,
        allowlistReview,
        generatedAt: new Date().toISOString(),
        minSeverity: args.minSeverity,
        policy: args.policy,
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
            policy: args.policy,
            registry: args.registry,
            runUrl: args.runUrl,
        })
    }

    const { jsonPath, markdownPath } = await writeOutputs(args, summary)

    console.info(`[dependency-risk-daily] ${summary.conclusion}`)
    console.info(`[dependency-risk-daily] Review Gate: ${summary.reviewGate.conclusion} (${summary.reviewGate.findingLevel})`)
    if (summary.allowlistReview) {
        const review = summary.allowlistReview
        console.info(`[dependency-risk-daily] Allowlist review: ${review.counts.expired} expired / ${review.counts.dueSoon} due soon / ${review.counts.scheduled} scheduled / ${review.counts.missing} missing`)
        review.expired.forEach((item) => {
            console.info(`[dependency-risk-daily] EXPIRED ${item.packageName} [${item.severity}] ${item.advisoryId}: reviewBy ${item.reviewBy} (${Math.abs(item.daysUntil)}d ago)`)
        })
        review.dueSoon.forEach((item) => {
            console.info(`[dependency-risk-daily] DUE SOON ${item.packageName} [${item.severity}] ${item.advisoryId}: reviewBy ${item.reviewBy} (${item.daysUntil}d left)`)
        })
    }
    console.info(`[dependency-risk-daily] JSON: ${jsonPath}`)
    console.info(`[dependency-risk-daily] Markdown: ${markdownPath}`)

    if (summary.requiresAttention && args.mode === 'error') {
        process.exitCode = 1
    }
}

export {
    classifyDependencyRiskOutcome,
    parseArgs,
    runDailyDependencyAudit,
}

if (isDirectExecution(import.meta.url)) {
    main().catch((error) => {
        console.error(`[dependency-risk-daily] ${error.message}`)
        process.exitCode = 1
    })
}
