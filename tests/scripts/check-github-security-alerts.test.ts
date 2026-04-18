import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    classifyAlert,
    evaluateSecurityAlertGate,
    main as securityAlertMain,
    mapAuditRiskToDependabotAlert,
    normalizeCodeScanningAlert,
    normalizeDependabotAlert,
    normalizeExceptionEntries,
    resolveGitHubToken,
} from '@/scripts/security/check-github-security-alerts.mjs'
import { loadLocalEnvFile, parseDotEnvFile } from '@/scripts/security/load-local-env.mjs'
import {
    buildArtifactPaths,
    countByBucket,
    fetchRepositoryAlerts,
    loadInputSnapshot,
    writeArtifacts,
} from '@/scripts/security/security-alert-gate-shared.mjs'

describe('check-github-security-alerts', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        delete process.env.SECURITY_ALERTS_TOKEN
        delete process.env.GH_TOKEN
        delete process.env.GITHUB_TOKEN
    })

    it('classifies open Dependabot alerts with patches as immediate fixes', () => {
        const alert = normalizeDependabotAlert({
            number: 12,
            state: 'open',
            dependency: {
                package: {
                    ecosystem: 'npm',
                    name: 'vite',
                },
            },
            security_advisory: {
                severity: 'high',
                summary: 'vite vulnerability',
            },
            security_vulnerability: {
                package: {
                    ecosystem: 'npm',
                    name: 'vite',
                },
                severity: 'high',
                first_patched_version: {
                    identifier: '7.3.9',
                },
            },
        })

        expect(classifyAlert(alert)).toMatchObject({
            bucket: 'immediate-fix',
        })
    })

    it('classifies open Dependabot alerts without patches as deferred', () => {
        const alert = normalizeDependabotAlert({
            number: 18,
            state: 'open',
            dependency: {
                package: {
                    ecosystem: 'npm',
                    name: 'legacy-lib',
                },
            },
            security_advisory: {
                severity: 'critical',
                summary: 'legacy-lib vulnerability',
            },
            security_vulnerability: {
                package: {
                    ecosystem: 'npm',
                    name: 'legacy-lib',
                },
                severity: 'critical',
                first_patched_version: null,
            },
        })

        expect(classifyAlert(alert)).toMatchObject({
            bucket: 'defer',
        })
    })

    it('classifies high severity non-test code scanning alerts as immediate fixes', () => {
        const alert = normalizeCodeScanningAlert({
            number: 4,
            state: 'open',
            rule: {
                id: 'js/xss',
                severity: 'error',
                security_severity_level: 'high',
                description: 'Potential XSS',
            },
            tool: {
                name: 'CodeQL',
            },
            most_recent_instance: {
                location: {
                    path: 'server/api/search/index.get.ts',
                },
                classifications: [],
            },
        })

        expect(classifyAlert(alert)).toMatchObject({
            bucket: 'immediate-fix',
        })
    })

    it('downgrades test-only code scanning alerts to observe', () => {
        const alert = normalizeCodeScanningAlert({
            number: 7,
            state: 'open',
            rule: {
                id: 'js/path-injection',
                severity: 'error',
                security_severity_level: 'critical',
                description: 'Potential path injection',
            },
            tool: {
                name: 'CodeQL',
            },
            most_recent_instance: {
                location: {
                    path: 'tests/server/api/search/index.get.test.ts',
                },
                classifications: ['test'],
            },
        })

        expect(classifyAlert(alert)).toMatchObject({
            bucket: 'observe',
        })
    })

    it('maps pnpm audit fallback risks into Dependabot-like alerts', () => {
        const alert = mapAuditRiskToDependabotAlert({
            advisoryId: 'GHSA-1234-5678-9999',
            packageName: 'html-minifier',
            patchedVersions: '>=7.2.0',
            paths: ['.>mjml>html-minifier'],
            recommendation: 'Upgrade to 7.2.0',
            severity: 'high',
            source: 'https://github.com/advisories/GHSA-1234-5678-9999',
            title: 'html-minifier vulnerability',
        })

        expect(alert).toMatchObject({
            alertNumber: 'audit:html-minifier:GHSA-1234-5678-9999',
            packageName: 'html-minifier',
            patchAvailable: true,
            source: 'dependabot',
            state: 'open',
        })
    })

    it('treats pnpm audit sentinel patched versions as no patch available', () => {
        const alert = mapAuditRiskToDependabotAlert({
            advisoryId: 'GHSA-no-patch',
            packageName: 'legacy-lib',
            patchedVersions: '<0.0.0',
            paths: ['.>legacy-lib'],
            recommendation: 'Manual review required',
            severity: 'high',
            source: 'https://github.com/advisories/GHSA-no-patch',
            title: 'legacy-lib vulnerability',
        })

        expect(alert).toMatchObject({
            patchAvailable: false,
            patchedVersion: null,
        })
        expect(classifyAlert(alert)).toMatchObject({
            bucket: 'defer',
        })
    })

    it('allows deferred high alerts only when exception baseline exists', () => {
        const deferredAlert = {
            alertNumber: '18',
            classification: {
                bucket: 'defer',
                reason: 'open Dependabot alert without patched version',
            },
            severity: 'critical',
            source: 'dependabot',
        }
        const immediateFixAlert = {
            alertNumber: '4',
            classification: {
                bucket: 'immediate-fix',
                reason: 'open high+ code scanning alert on non-test path',
            },
            severity: 'high',
            source: 'code-scanning',
        }

        const result = evaluateSecurityAlertGate({
            alerts: [deferredAlert, immediateFixAlert],
            exceptionEntries: normalizeExceptionEntries({
                entries: [
                    {
                        source: 'dependabot',
                        alertNumber: '18',
                        classification: 'defer',
                        reason: 'waiting upstream patch',
                        temporaryException: 'recheck next release',
                    },
                ],
            }),
            minSeverity: 'high',
        })

        expect(result.excepted).toHaveLength(1)
        expect(result.blocking).toHaveLength(1)
        expect(result.blocking[0]).toBe(immediateFixAlert)
    })

    it('prefers SECURITY_ALERTS_TOKEN over other GitHub tokens', () => {
        process.env.GITHUB_TOKEN = 'github-token'
        process.env.GH_TOKEN = 'gh-token'
        process.env.SECURITY_ALERTS_TOKEN = 'security-token'

        expect(resolveGitHubToken()).toBe('security-token')

        delete process.env.SECURITY_ALERTS_TOKEN
        expect(resolveGitHubToken()).toBe('gh-token')

        delete process.env.GH_TOKEN
        expect(resolveGitHubToken()).toBe('github-token')
    })

    it('returns a missing-token status without calling GitHub when token is absent', async () => {
        const fetchSpy = vi.fn()
        vi.stubGlobal('fetch', fetchSpy)

        const result = await fetchRepositoryAlerts({
            endpoint: 'dependabot/alerts',
            failureResolver: vi.fn(),
            normalizer: vi.fn(),
            owner: 'CaoMeiYouRen',
            perPage: 100,
            repo: 'momei',
            token: null,
        })

        expect(result).toEqual({
            alerts: [],
            sourceStatus: {
                detail: 'No GitHub token available; official repository alerts skipped.',
                kind: 'missing-token',
                sourceName: 'github-api',
            },
        })
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('paginates GitHub alert responses until the final short page', async () => {
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: () => Promise.resolve(JSON.stringify([{ number: 1 }, { number: 2 }])),
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: () => Promise.resolve(JSON.stringify([{ number: 3 }])),
            }))

        const result = await fetchRepositoryAlerts({
            endpoint: 'dependabot/alerts',
            failureResolver: vi.fn(),
            normalizer: (alert: { number: number }) => ({ alertNumber: String(alert.number) }),
            owner: 'CaoMeiYouRen',
            perPage: 2,
            repo: 'momei',
            token: 'token-123',
        })

        expect(result).toEqual({
            alerts: [
                { alertNumber: '1' },
                { alertNumber: '2' },
                { alertNumber: '3' },
            ],
            sourceStatus: {
                detail: 'Fetched 3 open alerts.',
                kind: 'ok',
                sourceName: 'github-api',
            },
        })
    })

    it('uses the provided failure resolver when GitHub responds with an error', async () => {
        const failureResolver = vi.fn(() => ({ kind: 'permission-denied', sourceName: 'github-api', detail: 'forbidden' }))
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 403,
            text: () => Promise.resolve(JSON.stringify({ message: 'forbidden' })),
        }))

        const result = await fetchRepositoryAlerts({
            endpoint: 'code-scanning/alerts',
            failureResolver,
            normalizer: vi.fn(),
            owner: 'CaoMeiYouRen',
            perPage: 100,
            repo: 'momei',
            token: 'token-123',
        })

        expect(failureResolver).toHaveBeenCalledWith({ message: 'forbidden' }, 403)
        expect(result).toEqual({
            alerts: [],
            sourceStatus: {
                kind: 'permission-denied',
                sourceName: 'github-api',
                detail: 'forbidden',
            },
        })
    })

    it('parses alert input snapshots and normalizes source statuses', async () => {
        const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-alert-snapshot-'))
        const snapshotPath = path.join(tempRoot, 'snapshot.json')

        try {
            await writeFile(snapshotPath, JSON.stringify({
                repository: { owner: 'CaoMeiYouRen', repo: 'momei' },
                dependabotAlerts: [{
                    number: 9,
                    state: 'open',
                    dependency: { package: { ecosystem: 'npm', name: 'vite' } },
                    security_advisory: { severity: 'high', summary: 'vite vulnerability' },
                    security_vulnerability: {
                        package: { ecosystem: 'npm', name: 'vite' },
                        severity: 'high',
                        first_patched_version: { identifier: '7.3.9' },
                    },
                }],
                codeScanningAlerts: [{
                    number: 7,
                    state: 'open',
                    rule: { id: 'js/xss', severity: 'error', security_severity_level: 'high' },
                    tool: { name: 'CodeQL' },
                    most_recent_instance: { location: { path: 'server/api/posts.get.ts' }, classifications: [] },
                }],
                sourceStatuses: {
                    dependabot: { kind: 'fallback', sourceName: 'pnpm-audit', detail: 'fallback active' },
                },
            }), 'utf8')

            const snapshot = await loadInputSnapshot(snapshotPath)

            expect(snapshot.repository).toEqual({ owner: 'CaoMeiYouRen', repo: 'momei' })
            expect(snapshot.dependabotAlerts[0]).toMatchObject({
                alertNumber: '9',
                packageName: 'vite',
            })
            expect(snapshot.codeScanningAlerts[0]).toMatchObject({
                alertNumber: '7',
                ruleId: 'js/xss',
            })
            expect(snapshot.sourceStatuses).toEqual({
                dependabot: { kind: 'fallback', sourceName: 'pnpm-audit', detail: 'fallback active' },
                codeScanning: { kind: 'ok', sourceName: 'input', detail: '' },
            })
        } finally {
            await rm(tempRoot, { force: true, recursive: true })
        }
    })

    it('builds artifact paths and writes both JSON and markdown outputs', async () => {
        const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-alert-artifacts-'))

        try {
            const artifactPaths = {
                json: path.join(tempRoot, 'artifacts', 'alerts.json'),
                md: path.join(tempRoot, 'artifacts', 'alerts.md'),
            }
            const alerts = [{
                alertNumber: '12',
                classification: { bucket: 'immediate-fix', reason: 'patched version available' },
                htmlUrl: 'https://example.com/alert/12',
                packageName: 'vite',
                patchedVersion: '7.3.9',
                severity: 'high',
                source: 'dependabot',
            }]

            expect(buildArtifactPaths({
                outputJson: null,
                outputMd: null,
            }, process.cwd())).toEqual({
                json: path.join(process.cwd(), 'artifacts', 'review-gate', '2026-04-18-security-alerts.json'),
                md: path.join(process.cwd(), 'artifacts', 'review-gate', '2026-04-18-security-alerts.md'),
            })

            expect(countByBucket(alerts)).toEqual({
                defer: 0,
                'immediate-fix': 1,
                observe: 0,
            })

            await writeArtifacts({
                alerts,
                artifactPaths,
                gateConclusion: 'Reject',
                minSeverity: 'high',
                repoRoot: tempRoot,
                repository: { owner: 'CaoMeiYouRen', repo: 'momei' },
                result: {
                    blocking: alerts,
                    excepted: [],
                    observe: [],
                    relevantAlerts: alerts,
                },
                sourceStatuses: {
                    dependabot: { kind: 'ok', sourceName: 'github-api', detail: 'Fetched 1 open alerts.' },
                    codeScanning: { kind: 'ok', sourceName: 'github-api', detail: 'Fetched 0 open alerts.' },
                },
            })

            const jsonArtifact = JSON.parse(readFileSync(artifactPaths.json, 'utf8'))
            const markdownArtifact = readFileSync(artifactPaths.md, 'utf8')

            expect(jsonArtifact.summary).toEqual({
                defer: 0,
                'immediate-fix': 1,
                observe: 0,
            })
            expect(markdownArtifact).toContain('Review Gate Record — security-alerts')
            expect(markdownArtifact).toContain('vite (12) [high] -> immediate-fix')
        } finally {
            await rm(tempRoot, { force: true, recursive: true })
        }
    })

    it('runs the security alert main flow with snapshot input and writes gate artifacts', async () => {
        const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-security-main-'))
        const inputPath = path.join(tempRoot, 'snapshot.json')
        const exceptionsPath = path.join(tempRoot, 'exceptions.json')
        const outputJsonPath = path.join(tempRoot, 'artifacts', 'alerts.json')
        const outputMdPath = path.join(tempRoot, 'artifacts', 'alerts.md')
        const originalArgv = process.argv
        const originalExitCode = process.exitCode
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

        try {
            await writeFile(inputPath, JSON.stringify({
                repository: { owner: 'CaoMeiYouRen', repo: 'momei' },
                dependabotAlerts: [{
                    number: 12,
                    state: 'open',
                    html_url: 'https://example.com/alert/12',
                    dependency: { package: { ecosystem: 'npm', name: 'vite' } },
                    security_advisory: { severity: 'high', summary: 'vite vulnerability' },
                    security_vulnerability: {
                        package: { ecosystem: 'npm', name: 'vite' },
                        severity: 'high',
                        first_patched_version: { identifier: '7.3.9' },
                    },
                }],
                codeScanningAlerts: [],
                sourceStatuses: {
                    dependabot: { kind: 'ok', sourceName: 'input', detail: 'snapshot' },
                    codeScanning: { kind: 'ok', sourceName: 'input', detail: 'snapshot' },
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
            const markdownArtifact = readFileSync(outputMdPath, 'utf8')

            expect(process.exitCode).toBe(1)
            expect(jsonArtifact.gateConclusion).toBe('Reject')
            expect(jsonArtifact.results.blocking).toHaveLength(1)
            expect(markdownArtifact).toContain('Review Gate Record — security-alerts')
            expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Security Alert Gate'))
        } finally {
            process.argv = originalArgv
            process.exitCode = originalExitCode
            infoSpy.mockRestore()
            await rm(tempRoot, { force: true, recursive: true })
        }
    })

    it('rejects malformed exception entries', () => {
        expect(() => normalizeExceptionEntries({
            entries: [
                {
                    source: 'dependabot',
                    alertNumber: '18',
                    classification: 'defer',
                    reason: '',
                    temporaryException: 'recheck next release',
                },
            ],
        })).toThrow(/Invalid security alert exception entry/)
    })

    it('parses dotenv entries with quotes and export prefix', () => {
        expect(parseDotEnvFile([
            '# comment',
            'export SECURITY_ALERTS_TOKEN="token-123"',
            'GH_TOKEN=gh-token',
            'EMPTY=',
        ].join('\n'))).toEqual([
            { key: 'SECURITY_ALERTS_TOKEN', value: 'token-123' },
            { key: 'GH_TOKEN', value: 'gh-token' },
            { key: 'EMPTY', value: '' },
        ])
    })

    it('loads local env file without overriding existing process env values', async () => {
        const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-security-env-'))
        const originalGithubToken = process.env.GITHUB_TOKEN
        const originalSecurityAlertsToken = process.env.SECURITY_ALERTS_TOKEN
        const originalGhToken = process.env.GH_TOKEN
        const originalCi = process.env.CI
        const originalGithubActions = process.env.GITHUB_ACTIONS

        try {
            await writeFile(path.join(tempRoot, '.env'), [
                'SECURITY_ALERTS_TOKEN=from-dotenv',
                'GH_TOKEN=from-gh-dotenv',
                'GITHUB_TOKEN=should-not-win',
            ].join('\n'))

            process.env.CI = 'false'
            delete process.env.GITHUB_ACTIONS
            process.env.GITHUB_TOKEN = 'from-process'
            delete process.env.SECURITY_ALERTS_TOKEN
            delete process.env.GH_TOKEN

            const result = await loadLocalEnvFile(tempRoot)

            expect(result.loaded).toBe(true)
            expect(result.injectedKeys).toEqual(['SECURITY_ALERTS_TOKEN', 'GH_TOKEN'])
            expect(result.skippedKeys).toEqual(['GITHUB_TOKEN'])
            expect(process.env.SECURITY_ALERTS_TOKEN).toBe('from-dotenv')
            expect(process.env.GH_TOKEN).toBe('from-gh-dotenv')
            expect(process.env.GITHUB_TOKEN).toBe('from-process')
        } finally {
            if (originalGithubToken === undefined) {
                delete process.env.GITHUB_TOKEN
            } else {
                process.env.GITHUB_TOKEN = originalGithubToken
            }

            if (originalSecurityAlertsToken === undefined) {
                delete process.env.SECURITY_ALERTS_TOKEN
            } else {
                process.env.SECURITY_ALERTS_TOKEN = originalSecurityAlertsToken
            }

            if (originalGhToken === undefined) {
                delete process.env.GH_TOKEN
            } else {
                process.env.GH_TOKEN = originalGhToken
            }

            if (originalCi === undefined) {
                delete process.env.CI
            } else {
                process.env.CI = originalCi
            }

            if (originalGithubActions === undefined) {
                delete process.env.GITHUB_ACTIONS
            } else {
                process.env.GITHUB_ACTIONS = originalGithubActions
            }

            await rm(tempRoot, { force: true, recursive: true })
        }
    })

    it('prefers security alerts token over other GitHub token env vars', () => {
        const originalGithubToken = process.env.GITHUB_TOKEN
        const originalSecurityAlertsToken = process.env.SECURITY_ALERTS_TOKEN
        const originalGhToken = process.env.GH_TOKEN

        try {
            process.env.GITHUB_TOKEN = 'from-github-token'
            process.env.GH_TOKEN = 'from-gh-token'
            process.env.SECURITY_ALERTS_TOKEN = 'from-security-alerts-token'

            expect(resolveGitHubToken()).toBe('from-security-alerts-token')

            delete process.env.SECURITY_ALERTS_TOKEN
            expect(resolveGitHubToken()).toBe('from-gh-token')

            delete process.env.GH_TOKEN
            expect(resolveGitHubToken()).toBe('from-github-token')

            delete process.env.GITHUB_TOKEN
            expect(resolveGitHubToken()).toBeNull()
        } finally {
            if (originalGithubToken === undefined) {
                delete process.env.GITHUB_TOKEN
            } else {
                process.env.GITHUB_TOKEN = originalGithubToken
            }

            if (originalSecurityAlertsToken === undefined) {
                delete process.env.SECURITY_ALERTS_TOKEN
            } else {
                process.env.SECURITY_ALERTS_TOKEN = originalSecurityAlertsToken
            }

            if (originalGhToken === undefined) {
                delete process.env.GH_TOKEN
            } else {
                process.env.GH_TOKEN = originalGhToken
            }
        }
    })

    it('skips local env loading when CI-style environment flags are truthy', async () => {
        const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'momei-security-env-ci-'))
        const originalCi = process.env.CI
        const originalSecurityAlertsToken = process.env.SECURITY_ALERTS_TOKEN

        try {
            await writeFile(path.join(tempRoot, '.env'), 'SECURITY_ALERTS_TOKEN=from-dotenv', 'utf8')

            process.env.CI = '1'
            delete process.env.SECURITY_ALERTS_TOKEN

            const result = await loadLocalEnvFile(tempRoot)

            expect(result.loaded).toBe(false)
            expect(result.injectedKeys).toEqual([])
            expect(process.env.SECURITY_ALERTS_TOKEN).toBeUndefined()
        } finally {
            if (originalCi === undefined) {
                delete process.env.CI
            } else {
                process.env.CI = originalCi
            }

            if (originalSecurityAlertsToken === undefined) {
                delete process.env.SECURITY_ALERTS_TOKEN
            } else {
                process.env.SECURITY_ALERTS_TOKEN = originalSecurityAlertsToken
            }

            await rm(tempRoot, { force: true, recursive: true })
        }
    })

    it('marks GitHub API network failures as unavailable instead of throwing', async () => {
        const originalFetch = globalThis.fetch
        const fetchMock = vi.fn(() => Promise.reject(new Error('network down')))

        globalThis.fetch = fetchMock

        try {
            const result = await fetchRepositoryAlerts({
                endpoint: 'dependabot/alerts',
                failureResolver: () => ({ detail: 'should not be used', kind: 'unavailable', sourceName: 'github-api' }),
                normalizer: (alert) => alert,
                owner: 'owner',
                perPage: 100,
                repo: 'repo',
                token: 'token',
            })

            expect(result).toMatchObject({
                alerts: [],
                sourceStatus: {
                    detail: 'network down',
                    kind: 'unavailable',
                    sourceName: 'github-api',
                },
            })
        } finally {
            globalThis.fetch = originalFetch
        }
    })
})
