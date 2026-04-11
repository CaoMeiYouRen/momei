import crypto from 'node:crypto'

export const DAILY_DEPENDENCY_RISK_ISSUE_TITLE_PREFIX = '依赖风险每日巡检告警'
export const DAILY_DEPENDENCY_RISK_ISSUE_MARKER = '<!-- dependency-risk-daily-issue -->'

const DATED_TITLE_PATTERN = new RegExp(`^${DAILY_DEPENDENCY_RISK_ISSUE_TITLE_PREFIX}(?:\\s+\\d{4}-\\d{2}-\\d{2})?$`)

function ensureGeneratedAtDate(generatedAt) {
    const date = new Date(generatedAt)
    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid generatedAt timestamp: ${generatedAt}`)
    }
    return date
}

export function formatDailyDependencyRiskIssueDate(generatedAt) {
    return ensureGeneratedAtDate(generatedAt).toISOString().slice(0, 10)
}

export function buildDailyDependencyRiskFingerprint(summary) {
    const fingerprintPayload = summary.status === 'audit_failed'
        ? {
            status: summary.status,
            error: summary.error || null,
        }
        : {
            status: summary.status,
            blockingRisks: Array.isArray(summary.blockingRisks)
                ? summary.blockingRisks.map((risk) => ({
                    advisoryId: risk.advisoryId,
                    packageName: risk.packageName,
                    severity: risk.severity,
                    patchedVersions: risk.patchedVersions,
                }))
                : [],
        }

    return crypto
        .createHash('sha256')
        .update(JSON.stringify(fingerprintPayload))
        .digest('hex')
}

export function buildDailyDependencyRiskFingerprintMarker(summary) {
    return `<!-- dependency-risk-fingerprint:${buildDailyDependencyRiskFingerprint(summary)} -->`
}

export function buildDailyDependencyRiskIssueTitle(summary) {
    return `${DAILY_DEPENDENCY_RISK_ISSUE_TITLE_PREFIX} ${formatDailyDependencyRiskIssueDate(summary.generatedAt)}`
}

export function buildDailyDependencyRiskIssueBody(summary) {
    const bodyLines = [
        '## 最新结论',
        `- 状态: ${summary.conclusion}`,
        `- 摘要: ${summary.summary}`,
        `- 运行链接: ${summary.runUrl || '未提供'}`,
        `- Relevant 风险数: ${summary.counts.relevant}`,
        `- Blocking 风险数: ${summary.counts.blocking}`,
        `- 可修复 Blocking 风险数: ${summary.counts.fixable}`,
        `- 审计生成时间: ${summary.generatedAt}`,
        '',
        '## 说明',
        '- 每日巡检的完整 JSON / Markdown 结果已随 workflow artifact 上传，保留最近 30 天用于追溯。',
    ]

    if (Array.isArray(summary.blockingRisks) && summary.blockingRisks.length > 0) {
        bodyLines.push('', '## Blocking Risks')
        for (const risk of summary.blockingRisks.slice(0, 10)) {
            bodyLines.push(`- ${risk.packageName} [${risk.severity}] ${risk.advisoryId} | patched: ${risk.patchedVersions}`)
        }
    }

    if (summary.status === 'audit_failed' && summary.error) {
        bodyLines.push('', '## 执行失败原因', `- ${summary.error}`)
    }

    bodyLines.push('', DAILY_DEPENDENCY_RISK_ISSUE_MARKER, buildDailyDependencyRiskFingerprintMarker(summary))
    return bodyLines.join('\n')
}

export function isDailyDependencyRiskIssue(issue) {
    const title = String(issue?.title || '').trim()
    const body = typeof issue?.body === 'string' ? issue.body : ''
    return DATED_TITLE_PATTERN.test(title) || body.includes(DAILY_DEPENDENCY_RISK_ISSUE_MARKER)
}

export function pickDailyDependencyRiskIssueForTitle(issues, title) {
    const matchingIssues = issues.filter((issue) => issue.title === title && isDailyDependencyRiskIssue(issue))

    matchingIssues.sort((left, right) => {
        if (left.state === right.state) {
            return Number(right.number || 0) - Number(left.number || 0)
        }
        return left.state === 'open' ? -1 : 1
    })

    return matchingIssues[0] || null
}

export function collectStaleDailyDependencyRiskIssueNumbers(issues, activeIssueNumber = null) {
    return issues
        .filter((issue) => isDailyDependencyRiskIssue(issue))
        .filter((issue) => issue.state === 'open')
        .filter((issue) => Number(issue.number) !== Number(activeIssueNumber))
        .map((issue) => issue.number)
}
