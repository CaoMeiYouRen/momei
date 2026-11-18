import { describe, expect, it } from 'vitest'
import {
    buildDailyDependencyAuditFailureSummary,
    buildDailyDependencyAuditSummary,
    parseArgs,
    renderDailyDependencyAuditMarkdown,
    serializeAllowlistReview,
} from '@/scripts/security/run-daily-dependency-audit.mjs'
import { evaluateAllowlistReviewDates, evaluateDependencyRiskGate, parseAuditReport } from '@/scripts/security/check-dependency-risk.mjs'

describe('run-daily-dependency-audit', () => {
    it('defaults to the daily dependency risk policy', () => {
        expect(parseArgs(['node', 'run-daily-dependency-audit.mjs'])).toMatchObject({
            minSeverity: 'high',
            mode: 'warn',
            policy: 'daily',
        })
    })

    it('returns a clean summary when no blocking high risks remain', () => {
        const summary = buildDailyDependencyAuditSummary({
            allowlist: '.github/security/dependency-risk-allowlist.json',
            generatedAt: '2026-04-06T00:00:00.000Z',
            minSeverity: 'high',
            policy: 'daily',
            registry: 'https://registry.npmjs.org/',
            result: {
                allowlisted: [],
                blocking: [],
                relevantRisks: [],
            },
            risks: [],
            runUrl: 'https://github.com/CaoMeiYouRen/momei/actions/runs/1',
        })

        expect(summary.status).toBe('clean')
        expect(summary.conclusion).toBe('无高危风险')
        expect(summary.reviewGate).toMatchObject({
            conclusion: 'Pass',
            findingLevel: 'none',
        })
        expect(renderDailyDependencyAuditMarkdown(summary)).toContain('当前 high 及以上依赖风险门禁通过')
    })

    it('keeps the same blocker conclusion for blocking risks as the release gate', () => {
        const summary = buildDailyDependencyAuditSummary({
            allowlist: '.github/security/dependency-risk-allowlist.json',
            generatedAt: '2026-05-25T12:00:00.000Z',
            minSeverity: 'high',
            policy: 'daily',
            registry: 'https://registry.npmjs.org/',
            result: {
                allowlisted: [],
                blocking: [{
                    advisoryId: 'GHSA-risk',
                    packageName: 'vite',
                    patchedVersions: 'vite@7.3.9',
                    paths: ['node_modules/vite'],
                    recommendation: 'Upgrade vite to 7.3.9',
                    severity: 'high',
                    source: 'https://github.com/advisories/GHSA-risk',
                    title: 'vite risk',
                }],
                relevantRisks: [{
                    advisoryId: 'GHSA-risk',
                    packageName: 'vite',
                    patchedVersions: 'vite@7.3.9',
                    paths: ['node_modules/vite'],
                    recommendation: 'Upgrade vite to 7.3.9',
                    severity: 'high',
                    source: 'https://github.com/advisories/GHSA-risk',
                    title: 'vite risk',
                }],
            },
            risks: [{
                advisoryId: 'GHSA-risk',
                packageName: 'vite',
                patchedVersions: 'vite@7.3.9',
                paths: ['node_modules/vite'],
                recommendation: 'Upgrade vite to 7.3.9',
                severity: 'high',
                source: 'https://github.com/advisories/GHSA-risk',
                title: 'vite risk',
            }],
            runUrl: 'https://example.com/runs/1',
        })

        expect(summary.status).toBe('risk_found')
        expect(summary.reviewGate).toMatchObject({
            conclusion: 'Reject',
            findingLevel: 'blocker',
        })
        expect(summary.requiresAttention).toBe(true)
        expect(summary.shouldOpenIssue).toBe(true)
    })

    it('classifies blocking risks into fixable and unfixable buckets', () => {
        const summary = buildDailyDependencyAuditSummary({
            allowlist: '.github/security/dependency-risk-allowlist.json',
            generatedAt: '2026-04-06T00:00:00.000Z',
            minSeverity: 'high',
            policy: 'daily',
            registry: 'https://registry.npmjs.org/',
            result: {
                allowlisted: [],
                blocking: [
                    {
                        advisoryId: 'GHSA-fixable',
                        key: 'serialize-javascript:GHSA-fixable:high',
                        packageName: 'serialize-javascript',
                        patchedVersions: '>=7.0.5',
                        paths: ['.>serialize-javascript'],
                        recommendation: 'Upgrade serialize-javascript to 7.0.5',
                        severity: 'high',
                        source: 'https://github.com/advisories/GHSA-fixable',
                        title: 'serialize-javascript high risk',
                    },
                    {
                        advisoryId: 'GHSA-unavailable',
                        key: 'legacy:GHSA-unavailable:critical',
                        packageName: 'legacy',
                        patchedVersions: 'unavailable',
                        paths: ['.>legacy'],
                        recommendation: 'No direct upgrade recommendation from audit source',
                        severity: 'critical',
                        source: 'https://github.com/advisories/GHSA-unavailable',
                        title: 'legacy critical risk',
                    },
                ],
                relevantRisks: [{}, {}],
            },
            risks: [{}, {}],
            runUrl: 'https://github.com/CaoMeiYouRen/momei/actions/runs/2',
        })

        expect(summary.status).toBe('risk_found')
        expect(summary.conclusion).toBe('发现可修复风险')
        expect(summary.counts.fixable).toBe(1)
        expect(summary.counts.unfixable).toBe(1)
        expect(renderDailyDependencyAuditMarkdown(summary)).toContain('serialize-javascript')
    })

    it('does not label blocking risks as fixable when no direct patch is available', () => {
        const summary = buildDailyDependencyAuditSummary({
            allowlist: '.github/security/dependency-risk-allowlist.json',
            generatedAt: '2026-04-06T00:00:00.000Z',
            minSeverity: 'high',
            policy: 'daily',
            registry: 'https://registry.npmjs.org/',
            result: {
                allowlisted: [],
                blocking: [
                    {
                        advisoryId: 'GHSA-unavailable',
                        key: 'legacy:GHSA-unavailable:critical',
                        packageName: 'legacy',
                        patchedVersions: 'unavailable',
                        paths: ['.>legacy'],
                        recommendation: 'No direct upgrade recommendation from audit source',
                        severity: 'critical',
                        source: 'https://github.com/advisories/GHSA-unavailable',
                        title: 'legacy critical risk',
                    },
                ],
                relevantRisks: [{}],
            },
            risks: [{}],
            runUrl: 'https://github.com/CaoMeiYouRen/momei/actions/runs/4',
        })

        expect(summary.status).toBe('risk_found')
        expect(summary.conclusion).toBe('发现高危风险（暂无直接修复版本）')
        expect(summary.counts.fixable).toBe(0)
    })

    it('keeps legacy pnpm audit None recommendation out of the fixable bucket', () => {
        const risks = parseAuditReport({
            advisories: {
                '1105440': {
                    id: 1105440,
                    title: 'html-minifier high risk',
                    module_name: 'html-minifier',
                    severity: 'high',
                    url: 'https://github.com/advisories/GHSA-pfq8-rq6v-vf5m',
                    github_advisory_id: 'GHSA-pfq8-rq6v-vf5m',
                    recommendation: 'None',
                    patched_versions: '<0.0.0',
                    findings: [{ paths: ['.>mjml>mjml-cli>html-minifier'] }],
                },
            },
        })
        const result = evaluateDependencyRiskGate({
            allowlistEntries: [],
            minSeverity: 'high',
            risks,
        })

        const summary = buildDailyDependencyAuditSummary({
            allowlist: '.github/security/dependency-risk-allowlist.json',
            generatedAt: '2026-04-06T00:00:00.000Z',
            minSeverity: 'high',
            policy: 'daily',
            registry: 'https://registry.npmjs.org/',
            result,
            risks,
            runUrl: 'https://github.com/CaoMeiYouRen/momei/actions/runs/5',
        })

        expect(summary.counts.fixable).toBe(0)
        expect(summary.conclusion).toBe('发现高危风险（暂无直接修复版本）')
    })

    it('marks audit failures with the same blocker-level review gate', () => {
        const summary = buildDailyDependencyAuditFailureSummary({
            allowlist: '.github/security/dependency-risk-allowlist.json',
            error: new Error('registry unavailable'),
            generatedAt: '2026-05-25T12:00:00.000Z',
            minSeverity: 'high',
            policy: 'daily',
            registry: 'https://registry.npmjs.org/',
            runUrl: 'https://example.com/runs/1',
        })

        expect(summary.status).toBe('audit_failed')
        expect(summary.reviewGate).toMatchObject({
            conclusion: 'Reject',
            findingLevel: 'blocker',
        })
        expect(summary.requiresAttention).toBe(true)
        expect(summary.shouldOpenIssue).toBe(true)
        expect(renderDailyDependencyAuditMarkdown(summary)).toContain('registry unavailable')
    })
})

describe('run-daily-dependency-audit 台账复核日期', () => {
    const entries = [
        { advisoryId: 'GHSA-expired', packageName: 'alpha', reviewBy: '2026-11-01', severity: 'high' },
        { advisoryId: 'GHSA-due-soon', packageName: 'beta', reviewBy: '2026-11-25', severity: 'high' },
        { advisoryId: 'GHSA-scheduled', packageName: 'gamma', reviewBy: '2027-05-14', severity: 'high' },
        { advisoryId: 'GHSA-missing', packageName: 'delta', severity: 'high' },
    ]

    const review = evaluateAllowlistReviewDates({ allowlistEntries: entries, now: new Date('2026-11-18T00:00:00.000Z') })

    it('把四条台账分成过期 / 即将到期 / 计划内 / 未登记', () => {
        const serialized = serializeAllowlistReview(review)

        expect(serialized?.counts).toEqual({ expired: 1, dueSoon: 1, scheduled: 1, missing: 1 })
        expect(serialized?.expired[0]).toMatchObject({ advisoryId: 'GHSA-expired', daysUntil: -17, reviewBy: '2026-11-01' })
        expect(serialized?.dueSoon[0]).toMatchObject({ advisoryId: 'GHSA-due-soon', daysUntil: 7 })
        expect(serialized?.missing[0]).toMatchObject({ advisoryId: 'GHSA-missing', packageName: 'delta' })
    })

    it('daily 摘要与 markdown 含复核段，且不改变门禁结论', () => {
        const summary = buildDailyDependencyAuditSummary({
            allowlist: '.github/security/dependency-risk-allowlist.json',
            allowlistReview: review,
            generatedAt: '2026-11-18T00:00:00.000Z',
            minSeverity: 'high',
            policy: 'daily',
            registry: 'https://registry.npmjs.org/',
            result: { allowlisted: [], blocking: [], relevantRisks: [] },
            risks: [],
            runUrl: '',
        })

        expect(summary.status).toBe('clean')
        expect(summary.reviewGate.conclusion).toBe('Pass')
        expect(summary.requiresAttention).toBe(false)
        expect(summary.allowlistReview?.counts).toEqual({ expired: 1, dueSoon: 1, scheduled: 1, missing: 1 })

        const markdown = renderDailyDependencyAuditMarkdown(summary)
        expect(markdown).toContain('## Allowlist 复核日期')
        expect(markdown).toContain('EXPIRED alpha')
        expect(markdown).toContain('DUE SOON beta')
        expect(markdown).toContain('MISSING delta')
    })

    it('审计失败摘要同样携带复核段（可缺省）', () => {
        const summary = buildDailyDependencyAuditFailureSummary({
            allowlist: '.github/security/dependency-risk-allowlist.json',
            error: new Error('registry unavailable'),
            generatedAt: '2026-11-18T00:00:00.000Z',
            minSeverity: 'high',
            policy: 'daily',
            registry: 'https://registry.npmjs.org/',
            runUrl: '',
        })

        expect(summary.allowlistReview).toBeNull()
        expect(renderDailyDependencyAuditMarkdown(summary)).not.toContain('## Allowlist 复核日期')
    })
})
