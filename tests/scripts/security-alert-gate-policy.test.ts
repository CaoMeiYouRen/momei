import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    annotateAlerts,
    fetchRepositoryAlerts,
    normalizeCodeScanningAlert,
} from '@/scripts/security/security-alert-gate-shared.mjs'
import {
    classifyAlert,
    evaluateSecurityAlertGate,
    main as securityAlertMain,
    normalizeExceptionEntries,
} from '@/scripts/security/check-github-security-alerts.mjs'

beforeEach(() => {
    vi.restoreAllMocks()
    delete process.env.SECURITY_ALERTS_TOKEN
    delete process.env.GH_TOKEN
    delete process.env.GITHUB_TOKEN
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('security alert dismissed / fail-closed policy', () => {
    function buildDismissedAlert(overrides = {}) {
        const alert = {
            alertNumber: '77',
            classification: null,
            dismissedReason: 'used in tests',
            htmlUrl: 'https://example.com/alert/77',
            locationPath: 'scripts/governance/example.mjs',
            packageName: null,
            paths: [],
            ruleId: 'js/example',
            severity: 'high',
            source: 'code-scanning',
            state: 'dismissed',
            ...overrides,
        }

        return {
            ...alert,
            classification: classifyAlert(alert),
        }
    }

    function buildExceptionEntry(overrides = {}) {
        return normalizeExceptionEntries({
            entries: [{
                category: 'false-positive',
                expiresAt: '2099-01-01',
                id: '77',
                location: 'scripts/governance/example.mjs',
                reason: '原 dismiss 原因：used in tests；已确认测试辅助代码不进入生产路径',
                review: '上游复扫关闭后移除',
                severity: 'high',
                source: 'code-scanning',
                target: 'js/example',
                tracking: 'docs/plan/backlog.md',
                ...overrides,
            }],
        })
    }

    it('classifies dismissed high+ and critical alerts as blocking buckets', () => {
        expect(buildDismissedAlert().classification.bucket).toBe('dismissed-high')
        expect(buildDismissedAlert({ severity: 'critical' }).classification.bucket).toBe('dismissed-critical')
        expect(buildDismissedAlert({ locationPath: 'tests/modules/example.ts' }).classification.bucket).toBe('observe')
    })

    it('allows dismissed high alerts only with a false-positive baseline', () => {
        const alert = buildDismissedAlert()
        const result = evaluateSecurityAlertGate({
            alerts: [alert],
            exceptionEntries: buildExceptionEntry(),
            minSeverity: 'high',
        })

        expect(result.excepted).toHaveLength(1)
        expect(result.dismissedBlocking).toHaveLength(0)
        expect(result.blocking).toHaveLength(0)
    })

    it('keeps dismissed high alerts blocking when the baseline is not false-positive', () => {
        const alert = buildDismissedAlert()
        const result = evaluateSecurityAlertGate({
            alerts: [alert],
            exceptionEntries: buildExceptionEntry({ category: 'no-fix' }),
            minSeverity: 'high',
        })

        expect(result.excepted).toHaveLength(0)
        expect(result.dismissedBlocking).toEqual([alert])
    })

    it('keeps dismissed critical alerts blocking even with an exception', () => {
        const alert = buildDismissedAlert({ severity: 'critical' })
        const result = evaluateSecurityAlertGate({
            alerts: [alert],
            exceptionEntries: buildExceptionEntry({ severity: 'high' }),
            minSeverity: 'high',
        })

        expect(result.blocking).toEqual([alert])
    })

    it('treats expired exceptions as inactive and reports them', () => {
        const alert = buildDismissedAlert()
        const result = evaluateSecurityAlertGate({
            alerts: [alert],
            exceptionEntries: buildExceptionEntry({ expiresAt: '2020-01-01' }),
            minSeverity: 'high',
        })

        expect(result.excepted).toHaveLength(0)
        expect(result.dismissedBlocking).toEqual([alert])
        expect(result.expiredExceptions).toHaveLength(1)
    })

    it('fails closed when an official source cannot be read', () => {
        const result = evaluateSecurityAlertGate({
            alerts: [],
            exceptionEntries: [],
            minSeverity: 'high',
            sourceStatuses: {
                codeScanning: { detail: 'No GitHub token available', kind: 'missing-token', sourceName: 'github-api' },
                dependabot: { detail: 'ok', kind: 'ok', sourceName: 'github-api' },
            },
        })

        expect(result.blocking).toHaveLength(0)
        expect(result.sourceFailures).toHaveLength(1)
        expect(result.transitionBlocking).toHaveLength(1)
    })

    it('requires location for code-scanning exception entries', () => {
        expect(() => buildExceptionEntry({ location: '' })).toThrow(/missing location/)
    })

    it('keeps transition-only findings report-only in main flow', async () => {
        const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-security-transition-'))
        const inputPath = path.join(tempRoot, 'snapshot.json')
        const exceptionsPath = path.join(tempRoot, 'exceptions.json')
        const outputJsonPath = path.join(tempRoot, 'artifacts', 'alerts.json')
        const outputMdPath = path.join(tempRoot, 'artifacts', 'alerts.md')
        const originalArgv = process.argv
        const originalExitCode = process.exitCode
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

        try {
            await writeFile(inputPath, JSON.stringify({
                codeScanningAlerts: [{
                    dismissed_reason: `won't fix`,
                    most_recent_instance: {
                        classifications: [],
                        location: { path: 'scripts/docs/check-doc-markers.mjs' },
                    },
                    number: 43,
                    rule: { id: 'js/bad-tag-filter', security_severity_level: 'high', severity: 'error' },
                    state: 'dismissed',
                }],
                dependabotAlerts: [],
                repository: { owner: 'CaoMeiYouRen', repo: 'momei' },
                sourceStatuses: {
                    codeScanning: { detail: 'snapshot', kind: 'ok', sourceName: 'input' },
                    dependabot: { detail: 'snapshot', kind: 'ok', sourceName: 'input' },
                },
            }), 'utf8')
            await writeFile(exceptionsPath, JSON.stringify({ entries: [] }), 'utf8')

            process.argv = [
                process.argv[0] || 'node',
                'check-github-security-alerts.mjs',
                `--input=${inputPath}`,
                `--exceptions=${exceptionsPath}`,
                `--output-json=${outputJsonPath}`,
                `--output-md=${outputMdPath}`,
                '--min-severity=high',
                '--mode=error',
                '--transition-mode',
            ]
            process.exitCode = undefined

            await securityAlertMain()

            const jsonArtifact = JSON.parse(readFileSync(outputJsonPath, 'utf8'))

            expect(process.exitCode ?? 0).toBe(0)
            expect(jsonArtifact.gateConclusion).toBe('Pass')
            expect(jsonArtifact.results.transitionBlocking).toHaveLength(1)
            expect(jsonArtifact.results.effectiveBlocking).toHaveLength(0)
        } finally {
            process.argv = originalArgv
            process.exitCode = originalExitCode
            infoSpy.mockRestore()
            await rm(tempRoot, { force: true, recursive: true })
        }
    })

    it('fails closed on source gaps outside transition mode', async () => {
        const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-security-source-gap-'))
        const inputPath = path.join(tempRoot, 'snapshot.json')
        const exceptionsPath = path.join(tempRoot, 'exceptions.json')
        const outputJsonPath = path.join(tempRoot, 'artifacts', 'alerts.json')
        const outputMdPath = path.join(tempRoot, 'artifacts', 'alerts.md')
        const originalArgv = process.argv
        const originalExitCode = process.exitCode
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

        try {
            await writeFile(inputPath, JSON.stringify({
                codeScanningAlerts: [],
                dependabotAlerts: [],
                repository: { owner: 'CaoMeiYouRen', repo: 'momei' },
                sourceStatuses: {
                    codeScanning: { detail: 'No GitHub token available', kind: 'missing-token', sourceName: 'github-api' },
                    dependabot: { detail: 'snapshot', kind: 'ok', sourceName: 'input' },
                },
            }), 'utf8')
            await writeFile(exceptionsPath, JSON.stringify({ entries: [] }), 'utf8')

            process.argv = [
                process.argv[0] || 'node',
                'check-github-security-alerts.mjs',
                `--input=${inputPath}`,
                `--exceptions=${exceptionsPath}`,
                `--output-json=${outputJsonPath}`,
                `--output-md=${outputMdPath}`,
                '--min-severity=high',
                '--mode=error',
            ]
            process.exitCode = undefined

            await securityAlertMain()

            const jsonArtifact = JSON.parse(readFileSync(outputJsonPath, 'utf8'))

            expect(process.exitCode).toBe(1)
            expect(jsonArtifact.gateConclusion).toBe('Reject')
            expect(jsonArtifact.results.effectiveBlocking).toHaveLength(1)
            expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Blocking source failures'))
        } finally {
            process.argv = originalArgv
            process.exitCode = originalExitCode
            infoSpy.mockRestore()
            await rm(tempRoot, { force: true, recursive: true })
        }
    })

    it('fetches open and dismissed states in one source read', async () => {
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: () => Promise.resolve(JSON.stringify([{ number: 1 }])),
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: () => Promise.resolve(JSON.stringify([{ number: 2 }])),
            }))

        const result = await fetchRepositoryAlerts({
            endpoint: 'code-scanning/alerts',
            failureResolver: vi.fn(),
            normalizer: (alert: { number: number }) => ({
                alertNumber: String(alert.number),
                source: 'code-scanning',
                state: 'open',
            }),
            owner: 'CaoMeiYouRen',
            perPage: 100,
            repo: 'momei',
            states: ['open', 'dismissed'],
            token: 'token-123',
        })

        expect(result.alerts).toHaveLength(2)
        expect(result.sourceStatus.detail).toBe('Fetched 2 alerts (open=1, dismissed=1).')
    })

    it('keeps partial open alerts when a later state fails', async () => {
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: () => Promise.resolve(JSON.stringify([{
                    most_recent_instance: {
                        classifications: [],
                        location: { path: 'server/api/example.ts' },
                    },
                    number: 91,
                    rule: { id: 'js/example', security_severity_level: 'high' },
                    state: 'open',
                }])),
            })
            .mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: () => Promise.resolve(JSON.stringify({ message: 'boom' })),
            }))

        const result = await fetchRepositoryAlerts({
            endpoint: 'code-scanning/alerts',
            failureResolver: () => ({ detail: 'HTTP 500', kind: 'unavailable', sourceName: 'github-api' }),
            normalizer: normalizeCodeScanningAlert,
            owner: 'CaoMeiYouRen',
            perPage: 100,
            repo: 'momei',
            states: ['open', 'dismissed'],
            token: 'token-123',
        })

        expect(result.alerts).toHaveLength(1)
        expect(result.sourceStatus.kind).toBe('unavailable')

        const evaluated = evaluateSecurityAlertGate({
            alerts: annotateAlerts(result.alerts),
            exceptionEntries: [],
            minSeverity: 'high',
            sourceStatuses: {
                codeScanning: result.sourceStatus,
                dependabot: { detail: 'ok', kind: 'ok', sourceName: 'github-api' },
            },
        })

        expect(evaluated.blocking).toHaveLength(1)
        expect(evaluated.sourceFailures).toHaveLength(1)
    })

    it('requires expiresAt and tracking for new ledger entries', () => {
        expect(() => buildExceptionEntry({ expiresAt: '' })).toThrow(/missing expiresAt/)
        expect(() => buildExceptionEntry({ tracking: '' })).toThrow(/missing tracking/)
    })

    it('rejects entries whose target or location does not match the alert', () => {
        const alert = buildDismissedAlert()

        for (const overrides of [
            { location: 'scripts/other.mjs' },
            { target: 'js/other-rule' },
        ]) {
            const result = evaluateSecurityAlertGate({
                alerts: [alert],
                exceptionEntries: buildExceptionEntry(overrides),
                minSeverity: 'high',
            })

            expect(result.excepted).toHaveLength(0)
            expect(result.dismissedBlocking).toEqual([alert])
        }
    })

    it('rejects dependabot entries whose path does not cover the alert path', () => {
        const alert = {
            alertNumber: '88',
            classification: classifyAlert({
                alertNumber: '88',
                dismissedReason: 'tolerable_risk',
                packageName: 'demo-package',
                paths: ['.>a>demo-package'],
                severity: 'high',
                source: 'dependabot',
                state: 'dismissed',
            }),
            dismissedReason: 'tolerable_risk',
            packageName: 'demo-package',
            paths: ['.>a>demo-package'],
            severity: 'high',
            source: 'dependabot',
            state: 'dismissed',
        }
        const exceptionEntries = normalizeExceptionEntries({
            entries: [{
                category: 'false-positive',
                expiresAt: '2099-01-01',
                id: '88',
                path: '.>other>demo-package',
                reason: '原 dismiss 原因：tolerable_risk',
                review: '复核后移除',
                severity: 'high',
                source: 'dependabot',
                target: 'demo-package',
                tracking: 'docs/plan/backlog.md',
            }],
        })
        const result = evaluateSecurityAlertGate({
            alerts: [alert],
            exceptionEntries,
            minSeverity: 'high',
        })

        expect(result.excepted).toHaveLength(0)
        expect(result.dismissedBlocking).toEqual([alert])
    })

    it('requires the original dismiss reason in a dismissed exception', () => {
        const alert = buildDismissedAlert()
        const result = evaluateSecurityAlertGate({
            alerts: [alert],
            exceptionEntries: buildExceptionEntry({ reason: '已确认误报' }),
            minSeverity: 'high',
        })

        expect(result.excepted).toHaveLength(0)
        expect(result.dismissedBlocking).toEqual([alert])
    })
})
