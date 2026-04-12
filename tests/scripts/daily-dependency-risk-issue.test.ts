import { describe, expect, it } from 'vitest'
import {
    DAILY_DEPENDENCY_RISK_ISSUE_MARKER,
    DAILY_DEPENDENCY_RISK_ISSUE_TITLE_PREFIX,
    buildDailyDependencyRiskIssueBody,
    buildDailyDependencyRiskIssueTitle,
    collectStaleDailyDependencyRiskIssueNumbers,
    formatDailyDependencyRiskIssueDate,
    isDailyDependencyRiskIssue,
    pickDailyDependencyRiskIssueForTitle,
} from '@/scripts/security/daily-dependency-risk-issue.mjs'

const baseSummary = {
    blockingRisks: [
        {
            advisoryId: 'GHSA-1',
            packageName: 'axios',
            patchedVersions: '>=1.15.0',
            severity: 'critical',
        },
    ],
    conclusion: '发现可修复风险',
    counts: {
        blocking: 1,
        fixable: 1,
        relevant: 1,
    },
    generatedAt: '2026-04-11T00:56:28.021Z',
    runUrl: 'https://github.com/CaoMeiYouRen/momei/actions/runs/24270869587',
    status: 'risk_found',
    summary: '发现 1 项可直接处理的 high+ 风险。',
}

describe('daily-dependency-risk-issue helpers', () => {
    it('formats a UTC date for daily issue titles', () => {
        expect(formatDailyDependencyRiskIssueDate(baseSummary.generatedAt)).toBe('2026-04-11')
        expect(buildDailyDependencyRiskIssueTitle(baseSummary)).toBe(`${DAILY_DEPENDENCY_RISK_ISSUE_TITLE_PREFIX} 2026-04-11`)
    })

    it('builds an issue body with shared markers', () => {
        const body = buildDailyDependencyRiskIssueBody(baseSummary)

        expect(body).toContain('## 最新结论')
        expect(body).toContain(DAILY_DEPENDENCY_RISK_ISSUE_MARKER)
        expect(body).toContain('dependency-risk-fingerprint:')
    })

    it('recognizes both dated and legacy daily audit issues', () => {
        expect(isDailyDependencyRiskIssue({
            title: `${DAILY_DEPENDENCY_RISK_ISSUE_TITLE_PREFIX} 2026-04-11`,
        })).toBe(true)
        expect(isDailyDependencyRiskIssue({
            body: DAILY_DEPENDENCY_RISK_ISSUE_MARKER,
            title: DAILY_DEPENDENCY_RISK_ISSUE_TITLE_PREFIX,
        })).toBe(true)
        expect(isDailyDependencyRiskIssue({
            title: '其他 issue',
        })).toBe(false)
    })

    it('reuses the open issue for the same date title', () => {
        const title = buildDailyDependencyRiskIssueTitle(baseSummary)
        const issue = pickDailyDependencyRiskIssueForTitle([
            {
                body: DAILY_DEPENDENCY_RISK_ISSUE_MARKER,
                number: 11,
                state: 'closed',
                title,
            },
            {
                body: DAILY_DEPENDENCY_RISK_ISSUE_MARKER,
                number: 12,
                state: 'open',
                title,
            },
        ], title)

        expect(issue?.number).toBe(12)
    })

    it('reuses a closed same-day issue when no open match remains', () => {
        const title = buildDailyDependencyRiskIssueTitle(baseSummary)
        const issue = pickDailyDependencyRiskIssueForTitle([
            {
                body: DAILY_DEPENDENCY_RISK_ISSUE_MARKER,
                number: 31,
                state: 'closed',
                title,
            },
        ], title)

        expect(issue?.number).toBe(31)
    })

    it('collects only stale open daily audit issue numbers', () => {
        expect(collectStaleDailyDependencyRiskIssueNumbers([
            {
                body: DAILY_DEPENDENCY_RISK_ISSUE_MARKER,
                number: 21,
                state: 'open',
                title: `${DAILY_DEPENDENCY_RISK_ISSUE_TITLE_PREFIX} 2026-04-10`,
            },
            {
                body: DAILY_DEPENDENCY_RISK_ISSUE_MARKER,
                number: 22,
                state: 'open',
                title: `${DAILY_DEPENDENCY_RISK_ISSUE_TITLE_PREFIX} 2026-04-11`,
            },
            {
                body: DAILY_DEPENDENCY_RISK_ISSUE_MARKER,
                number: 23,
                state: 'closed',
                title: `${DAILY_DEPENDENCY_RISK_ISSUE_TITLE_PREFIX} 2026-04-09`,
            },
            {
                number: 24,
                state: 'open',
                title: DAILY_DEPENDENCY_RISK_ISSUE_TITLE_PREFIX,
            },
            {
                number: 25,
                state: 'open',
                title: '其他 issue',
            },
        ], 22)).toEqual([21, 24])
    })
})
