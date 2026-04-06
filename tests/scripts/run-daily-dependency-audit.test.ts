import { describe, expect, it } from 'vitest'
import {
    buildDailyDependencyAuditFailureSummary,
    buildDailyDependencyAuditSummary,
    renderDailyDependencyAuditMarkdown,
} from '@/scripts/security/run-daily-dependency-audit.mjs'
import { evaluateDependencyRiskGate, parseAuditReport } from '@/scripts/security/check-dependency-risk.mjs'

describe('run-daily-dependency-audit', () => {
    it('returns a clean summary when no blocking high risks remain', () => {
        const summary = buildDailyDependencyAuditSummary({
            allowlist: '.github/security/dependency-risk-allowlist.json',
            generatedAt: '2026-04-06T00:00:00.000Z',
            minSeverity: 'high',
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
        expect(renderDailyDependencyAuditMarkdown(summary)).toContain('当前 high 及以上依赖风险门禁通过')
    })

    it('classifies blocking risks into fixable and unfixable buckets', () => {
        const summary = buildDailyDependencyAuditSummary({
            allowlist: '.github/security/dependency-risk-allowlist.json',
            generatedAt: '2026-04-06T00:00:00.000Z',
            minSeverity: 'high',
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
            registry: 'https://registry.npmjs.org/',
            result,
            risks,
            runUrl: 'https://github.com/CaoMeiYouRen/momei/actions/runs/5',
        })

        expect(summary.counts.fixable).toBe(0)
        expect(summary.conclusion).toBe('发现高危风险（暂无直接修复版本）')
    })

    it('returns an audit failure summary when execution fails', () => {
        const summary = buildDailyDependencyAuditFailureSummary({
            allowlist: '.github/security/dependency-risk-allowlist.json',
            error: new Error('registry unavailable'),
            generatedAt: '2026-04-06T00:00:00.000Z',
            minSeverity: 'high',
            registry: 'https://registry.npmjs.org/',
            runUrl: 'https://github.com/CaoMeiYouRen/momei/actions/runs/3',
        })

        expect(summary.status).toBe('audit_failed')
        expect(summary.conclusion).toBe('审计执行失败')
        expect(renderDailyDependencyAuditMarkdown(summary)).toContain('registry unavailable')
    })
})
