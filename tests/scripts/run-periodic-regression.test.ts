import { describe, expect, it } from 'vitest'
import {
    buildEvidence,
    LOG_WINDOW_LIMITS,
    PERIODIC_REGRESSION_PROFILES,
    assessRegressionLogWindow,
    resolveRegressionProfile,
    summarizeRegressionRun,
} from '@/scripts/regression/run-periodic-regression.mjs'

describe('run-periodic-regression', () => {
    it('exposes the three fixed cadence profiles', () => {
        expect(Object.keys(PERIODIC_REGRESSION_PROFILES)).toEqual([
            'weekly',
            'pre-release',
            'phase-close',
        ])
        expect(resolveRegressionProfile('weekly').steps.map((step) => step.label)).toEqual([
            'test:coverage',
            'security:audit-deps',
            'docs:check:source-of-truth',
            'docs:check:i18n',
            'i18n:audit:missing',
            'duplicate-code:check',
        ])
        expect(resolveRegressionProfile('phase-close').steps.at(-1)).toMatchObject({
            label: 'review-gate:generate:check',
            timeoutBudget: '20m',
        })
    })

    it('marks regression-log as archive-required once the activity window exceeds limits', () => {
        const content = [
            '# 回归日志',
            '## 当前窗口与索引',
            '## 维护规则',
            '## 归档规则',
            ...Array.from({ length: LOG_WINDOW_LIMITS.maxEntries + 1 }, (_, index) => `## 记录 ${index + 1}`),
            ...Array.from({ length: LOG_WINDOW_LIMITS.maxLines }, () => '- filler'),
        ].join('\n')

        const logHealth = assessRegressionLogWindow(content)

        expect(logHealth.shouldArchive).toBe(true)
        expect(logHealth.entryCount).toBe(LOG_WINDOW_LIMITS.maxEntries + 1)
        expect(logHealth.reasons).toEqual(expect.arrayContaining([
            expect.stringContaining(`超过 ${LOG_WINDOW_LIMITS.maxEntries} 条窗口`),
            expect.stringContaining(`超过 ${LOG_WINDOW_LIMITS.maxLines} 行窗口`),
        ]))
    })

    it('treats archive overflow as a phase-close blocker but only warning for weekly cadence', () => {
        const logHealth = {
            entryCount: LOG_WINDOW_LIMITS.maxEntries + 1,
            lineCount: LOG_WINDOW_LIMITS.maxLines + 1,
            reasons: ['活动日志超过窗口'],
            shouldArchive: true,
        }
        const passingResults = resolveRegressionProfile('weekly').steps.map((step) => ({
            ...step,
            ok: true,
            skipped: false,
        }))

        const weekly = summarizeRegressionRun({
            logHealth,
            profile: resolveRegressionProfile('weekly'),
            results: passingResults,
        })
        const phaseClose = summarizeRegressionRun({
            logHealth,
            profile: resolveRegressionProfile('phase-close'),
            results: resolveRegressionProfile('phase-close').steps.map((step) => ({
                ...step,
                ok: true,
                skipped: false,
            })),
        })

        expect(weekly.conclusion).toBe('Pass')
        expect(weekly.warnings).toEqual(expect.arrayContaining([
            expect.stringContaining('regression-log window exceeded'),
        ]))
        expect(phaseClose.conclusion).toBe('Reject')
        expect(phaseClose.blockers).toEqual(expect.arrayContaining([
            expect.stringContaining('regression-log window exceeded'),
        ]))
    })

    it('keeps non-required command failures as warnings', () => {
        const profile = resolveRegressionProfile('pre-release')
        const results = profile.steps.map((step) => ({
            ...step,
            ok: step.label !== 'duplicate-code:check',
            skipped: false,
        }))

        const summary = summarizeRegressionRun({
            logHealth: {
                entryCount: 6,
                lineCount: 180,
                reasons: [],
                shouldArchive: false,
            },
            profile,
            results,
        })

        expect(summary.conclusion).toBe('Pass')
        expect(summary.blockers).toHaveLength(0)
        expect(summary.warnings).toEqual(['duplicate-code:check failed'])
    })

    it('builds markdown evidence with command status and review-gate findings', () => {
        const profile = resolveRegressionProfile('weekly')
        const evidence = buildEvidence({
            artifactJsonPath: '/tmp/weekly.json',
            artifactMarkdownPath: '/tmp/weekly.md',
            dryRun: true,
            logHealth: {
                entryCount: 3,
                lineCount: 120,
                reasons: [],
                shouldArchive: false,
            },
            mode: 'warn',
            profile,
            results: profile.steps.slice(0, 2).map((step, index) => ({
                ...step,
                ok: index === 0,
                skipped: index === 1,
            })),
            summary: {
                blockers: [],
                conclusion: 'Prepared',
                warnings: ['duplicate-code:check failed'],
            },
        })

        expect(evidence).toContain('Review Gate Record — weekly periodic regression')
        expect(evidence).toContain('- 结果: PASS')
        expect(evidence).toContain('- 结果: DRY RUN')
        expect(evidence).toContain('- 结论: Prepared')
        expect(evidence).toContain('- duplicate-code:check failed')
    })

    it('throws for unsupported regression profiles', () => {
        expect(() => resolveRegressionProfile('nightly')).toThrow(/Unsupported regression profile/)
    })
})
